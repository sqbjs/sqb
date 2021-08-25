import {And, Select, In, Param} from '@sqb/builder';
import type {Repository} from '../repository.class';
import type {EntityModel} from '../model/entity-model';
import type {EntityColumnElement} from '../model/entity-column-element';
import {RowConverter} from './row-converter';
import {AssociationNode} from '../model/association-node';
import {isColumnElement, isObjectElement, isAssociationElement} from '../util/orm.helper';
import {prepareFilter, JoinInfo, joinAssociationGetLast} from './command.helper';
import {SqbConnection} from '../../client/SqbConnection';
import {getNonAssociationElementNames} from '../base-entity.class';

export type FindCommandArgs = {
    entity: EntityModel;
    connection: SqbConnection
} & Repository.FindAllOptions;

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

export class FindCommand {
    maxEagerFetch: number = 100000;
    maxSubQueries: number = 5;
    readonly mainEntity: EntityModel;
    readonly resultEntity: EntityModel;
    readonly converter: RowConverter;
    readonly mainAlias: string = 'T';
    resultAlias: string = 'T';
    private _joins: JoinInfo[] = [];
    private _selectColumns: Record<string, {
        statement: string;
        element: EntityColumnElement;
    }> = {};
    private _filter = And();
    private _sort?: string[];

    protected constructor(selectEntity: EntityModel, outputEntity: EntityModel) {
        this.mainEntity = selectEntity;
        this.resultEntity = outputEntity;
        this.converter = new RowConverter(outputEntity.ctor);
    }

    static async create(source: EntityModel | AssociationNode, opts: {
        maxSubQueries?: number;
        maxEagerFetch?: number;
    } = {}): Promise<FindCommand> {
        let command: FindCommand;
        let listingEntity: EntityModel;
        if (source instanceof AssociationNode) {
            const node = source;
            listingEntity = await node.resolveTarget();
            const resultEntity = await node.getLast().resolveTarget();
            command = new FindCommand(listingEntity, resultEntity);
            if (node.conditions)
                await command.filter(node.conditions);
            if (node.next) {
                const join = await joinAssociationGetLast(command._joins, node.next, command.mainAlias);
                command.resultAlias = join.joinAlias;
            }
        } else {
            listingEntity = source;
            command = new FindCommand(listingEntity, listingEntity);
        }
        if (!listingEntity.tableName)
            throw new Error(`${listingEntity.ctor.name} is not decorated with @Entity decorator`);
        if (typeof opts.maxSubQueries === 'number')
            command.maxSubQueries = opts.maxSubQueries;
        if (typeof opts.maxEagerFetch === 'number')
            command.maxEagerFetch = opts.maxEagerFetch;
        return command;
    }

    static async execute(args: FindCommandArgs): Promise<any[]> {
        const command = await FindCommand.create(args.entity, {
            maxSubQueries: args.maxSubQueries,
            maxEagerFetch: args.maxEagerFetch,
        });

        await command.addElements({
            elements: args.elements,
            include: args.include,
            exclude: args.exclude,
            sort: args.sort
        });

        if (args.filter)
            await command.filter(args.filter);
        if (args.sort)
            await command.sort(args.sort);

        return await command.execute(args);
    }

    async addElements(opts: {
                          tableAlias?: string;
                          converter?: RowConverter;
                          entity?: EntityModel;
                          elements?: string[];
                          include?: string[];
                          exclude?: string[];
                          sort?: string[];
                          prefix?: string;
                          suffix?: string;
                      } = {}
    ): Promise<void> {
        const tableAlias = opts.tableAlias || this.resultAlias;
        const entity = opts.entity || this._getEntityFromAlias(tableAlias);
        const converter = opts.converter || this.converter;

        let requestElements: string[] = opts.elements && opts.elements.length ?
            [...opts.elements] : getNonAssociationElementNames(entity.ctor);
        if (opts.include && opts.include.length)
            requestElements.push(...opts.include);
        requestElements = requestElements.map(x => x.toLowerCase());
        const excludeElements = opts.exclude && opts.exclude.length ?
            opts.exclude.map(x => x.toLowerCase()) : undefined;
        const sortElements = opts.sort && opts.sort.length ?
            opts.sort.map(x => x.toLowerCase()) : undefined;
        const prefix = opts.prefix || '';
        const suffix = opts.suffix || '';

        for (const key of entity.elementKeys) {
            const col = entity.getElement(key);
            if (!col)
                continue;
            const colNameLower = col.name.toLowerCase();

            // Ignore element if in excluded list
            if (excludeElements && excludeElements.includes(colNameLower))
                continue;

            // Check if element request list
            if (!requestElements.find(
                (x: string) => x === colNameLower || x.startsWith(colNameLower + '.'))
            ) continue;

            // Add field to select list if element is a column
            if (isColumnElement(col)) {
                const fieldAlias = this._selectColumn(tableAlias, col, prefix, suffix);
                // Add column to converter
                if (!col.hidden)
                    converter.addValueProperty({
                        name: col.name,
                        fieldAlias,
                        dataType: col.dataType,
                        parse: col.parse
                    });
                continue;
            }

            if (isObjectElement(col)) {
                const typ = await col.resolveType();
                const subConverter = converter.addObjectProperty({
                    name: col.name,
                    type: typ.ctor
                }).converter;
                await this.addElements({
                    tableAlias,
                    converter: subConverter,
                    entity: typ,
                    prefix: col.fieldNamePrefix,
                    suffix: col.fieldNameSuffix,
                    elements: extractSubElements(colNameLower, requestElements),
                    exclude: extractSubElements(colNameLower, excludeElements),
                    sort: extractSubElements(colNameLower, sortElements),
                });
                continue;
            }

            if (isAssociationElement(col)) {

                // OtO relation
                if (!col.association.returnsMany()) {
                    const joinInfo = await joinAssociationGetLast(this._joins, col.association, tableAlias);
                    const subConverter = converter.addObjectProperty({
                        name: col.name,
                        type: joinInfo.targetEntity.ctor
                    }).converter;
                    // Add join fields to select columns list
                    await this.addElements({
                        tableAlias: joinInfo.joinAlias,
                        converter: subConverter,
                        entity: joinInfo.targetEntity,
                        elements: extractSubElements(colNameLower, requestElements),
                        exclude: extractSubElements(colNameLower, excludeElements),
                        sort: extractSubElements(colNameLower, sortElements),
                    });
                    continue;
                }

                // One-2-Many Eager relation
                if (this.maxSubQueries > 0) {
                    const targetCol = await col.association.resolveTargetProperty();
                    const sourceCol = await col.association.resolveSourceProperty();
                    // We need to know key value to filter sub query.
                    // So add key field into select columns
                    const parentField = this._selectColumn(tableAlias, sourceCol);

                    const findCommand = await FindCommand.create(col.association, {
                        maxSubQueries: this.maxSubQueries - 1,
                        maxEagerFetch: this.maxEagerFetch
                    });
                    await findCommand.filter(In(targetCol.name, Param(parentField)));
                    const sort = sortElements && extractSubElements(colNameLower, sortElements);
                    await findCommand.addElements({
                        elements: extractSubElements(colNameLower, requestElements),
                        exclude: extractSubElements(colNameLower, excludeElements),
                        sort,
                    });
                    if (sort)
                        await findCommand.sort(sort);
                    const keyField = findCommand._selectColumn(findCommand.mainAlias, targetCol);

                    const resultType = await col.association.getLast().resolveTarget();
                    converter.addNestedProperty({
                        name: col.name,
                        type: resultType.ctor,
                        findCommand,
                        parentField,
                        keyField,
                        sort: extractSubElements(colNameLower, sortElements)
                    });
                }
            }
        }
    }

    private _selectColumn(tableAlias: string, el: EntityColumnElement,
                          prefix?: string, suffix?: string): string {
        const fieldName = (prefix || '').toLowerCase() +
            el.fieldName.toUpperCase() +
            (suffix || '').toLowerCase();
        const fieldAlias = tableAlias + '_' + fieldName;
        this._selectColumns[fieldAlias] = {
            element: el,
            statement: tableAlias + '.' + fieldName + ' as ' + fieldAlias
        };
        return fieldAlias;
    }

    async filter(filter: any): Promise<void> {
        await prepareFilter(this.mainEntity, filter, this._filter);
    }

    async sort(sortElements: string[]): Promise<void> {
        const orderColumns: string[] = [];
        for (const item of sortElements) {
            const m = item.match(SORT_ORDER_PATTERN);
            if (!m)
                throw new Error(`"${item}" is not a valid order expression`);

            let elName = m[2];
            let prefix = '';
            let suffix = '';
            let _entityDef = this.resultEntity;
            let tableAlias = this.resultAlias;
            if (elName.includes('.')) {
                const a: string[] = elName.split('.');
                while (a.length > 1) {
                    const col = _entityDef.getElement(a.shift() || '');
                    if (isObjectElement(col)) {
                        _entityDef = await col.resolveType();
                        if (col.fieldNamePrefix)
                            prefix += col.fieldNamePrefix;
                        if (col.fieldNameSuffix)
                            suffix = col.fieldNameSuffix + suffix;
                    } else if (isAssociationElement(col)) {
                        if (col.association.returnsMany()) {
                            elName = '';
                            break;
                        }
                        const joinInfo = await joinAssociationGetLast(this._joins, col.association, tableAlias);
                        tableAlias = joinInfo.joinAlias;
                        _entityDef = joinInfo.targetEntity;
                    } else throw new Error(`Invalid column (${elName}) declared in sort property`);
                }
                if (!elName)
                    continue;
                elName = a.shift() || '';
            }
            const col = _entityDef.getElement(elName);
            if (!col)
                throw new Error(`Unknown element (${elName}) declared in sort property`);
            if (!isColumnElement(col))
                throw new Error(`Can not sort by "${elName}", because it is not a data column`);

            const dir = m[1] || '+';
            orderColumns.push((dir || '') + tableAlias + '.' + prefix + col.fieldName + suffix);
        }
        this._sort = orderColumns;
    }

    async execute(args: Pick<FindCommandArgs, 'connection' | 'distinct' |
        'offset' | 'limit' | 'params' | 'onTransformRow'>
    ): Promise<any[]> {
        // Generate select query
        const columnSqls = Object.keys(this._selectColumns)
            .map(x => this._selectColumns[x].statement);
        if (!columnSqls.length)
            return [];

        const query = Select(...columnSqls)
            .from(this.mainEntity.tableName + ' as ' + this.mainAlias);

        if (args.distinct)
            query.distinct();

        query.where(...this._filter._items);

        if (this._sort) {
            query.orderBy(...this._sort);
        }
        if (args.offset)
            query.offset(args.offset);

        // joins must be added last
        if (this._joins)
            for (const j of this._joins) {
                query.join(j.join);
            }

        // Execute query
        const resp = await args.connection.execute(query, {
            params: args?.params,
            fetchRows: args?.limit,
            objectRows: false,
            cursor: false
        });

        // Create objects
        if (resp.rows && resp.fields) {
            return this.converter.transform(args.connection, resp.fields, resp.rows, args.onTransformRow);
        }
        return [];
    }

    private _getEntityFromAlias(tableAlias: string): EntityModel {
        if (tableAlias === this.mainAlias)
            return this.mainEntity;
        if (tableAlias === this.resultAlias)
            return this.resultEntity;
        if (this._joins) {
            const join = this._joins.find(j => j.joinAlias === tableAlias);
            if (join)
                return join.targetEntity;
        }
        throw new Error(`Unknown table alias "${tableAlias}"`);
    }

}

function extractSubElements(colNameLower: string, elements?: string[]): string[] | undefined {
    if (!elements || !elements.length)
        return elements;
    return elements.reduce((trg: string[], v: string) => {
        if (v.startsWith(colNameLower + '.'))
            trg.push(v.substring(colNameLower.length + 1).toLowerCase())
        return trg;
    }, [] as string[]);
}


