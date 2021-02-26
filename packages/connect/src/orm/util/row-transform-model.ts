import type {QueryExecutor} from '../../client/types';
import type {FieldInfoMap} from '../../client/FieldInfoMap';
import type {EntityMeta} from '../metadata/entity-meta';
import type {EntityElementMeta} from '../metadata/entity-element-meta';
import {isRelationElement, RelationElementMeta} from '../metadata/relation-element-meta';
import {DataColumnMeta, isDataColumn} from '../metadata/data-column-meta';
import {EmbeddedElementMeta} from '../metadata/embedded-element-meta';
import {FindCommandArgs} from '../commands/find.command';

export interface RowTransformItem {
    element: EntityElementMeta;
    fieldAlias: string;
    node?: RowTransformModel;
    subQueryOptions?: Omit<FindCommandArgs, 'entity' | 'connection'>;
    eagerParams?: any;
    eagerTargets?: any[];
}

const isOne2ManyEagerProperty = (prop: RowTransformItem): boolean => {
    return !!(isRelationElement(prop.element) && prop.subQueryOptions && !prop.element.lazy)
}

export class RowTransformModel {
    entity: EntityMeta;
    private _properties: Record<string, RowTransformItem> = {};
    private _propertyKeys?: string[];
    private _circularCheckList: EntityMeta[];

    constructor(entity: EntityMeta, parent?: RowTransformModel) {
        this.entity = entity;
        this._circularCheckList = parent?._circularCheckList || [];
        this._circularCheckList.push(entity);
    }

    addDataElement(col: DataColumnMeta, fieldAlias: string) {
        this._properties[col.name] = {
            element: col,
            fieldAlias
        };
        this._propertyKeys = undefined;
    }

    addOne2ManyEagerElement(col: RelationElementMeta,
                            fieldAlias: string,
                            options?: Omit<FindCommandArgs, 'entity' | 'connection'>) {
        this._properties[col.name] = {
            element: col,
            fieldAlias,
            subQueryOptions: options
        };
        this._propertyKeys = undefined;
    }

    addNode(col: EmbeddedElementMeta | RelationElementMeta, node: RowTransformModel) {
        this._properties[col.name] = {
            element: col,
            fieldAlias: '',
            node
        };
        this._propertyKeys = undefined;
    }

    get elementKeys(): string[] {
        if (!this._propertyKeys)
            this._propertyKeys = Object.keys(this._properties);
        return this._propertyKeys;
    }

    async transform(connection: QueryExecutor, fields: FieldInfoMap, rows: any): Promise<any[]> {
        const rowLen = rows.length;
        const result: any[] = [];
        for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
            const o = await this.transformRow(connection, fields, rows[rowIdx]);
            result.push(o);
        }
        if (!this.elementKeys)
            return result;

        await this.iterateForOne2Many(this, connection);

        return result;
    }

    private async iterateForOne2Many(node: RowTransformModel, connection: QueryExecutor): Promise<void> {
        // Fetch one-2-many related rows and merge with result rows
        const propertyLen = node.elementKeys.length;
        for (let propIdx = 0; propIdx < propertyLen; propIdx++) {
            const propKey = node.elementKeys[propIdx];
            const prop = node._properties[propKey];

            if (prop.eagerTargets && isRelationElement(prop.element) && prop.subQueryOptions) {
                const {FindCommand} = await import('../commands/find.command');
                const targetEntity = await prop.element.foreign.resolveTarget();
                if (this._circularCheckList.includes(targetEntity))
                    throw new Error('Circular query call is not allowed');

                const subQueryOptions = prop.subQueryOptions;
                const keyCol = await prop.element.foreign.resolveKeyColumnName();
                const trgCol = await prop.element.foreign.resolveTargetColumnName();

                const r = await FindCommand.execute({
                    ...subQueryOptions,
                    entity: targetEntity,
                    connection,
                    limit: subQueryOptions.maxEagerFetch,
                    params: prop.eagerParams
                });
                const subRows = new Set(r);
                for (const obj of prop.eagerTargets) {
                    // init array value for element
                    // noinspection JSMismatchedCollectionQueryUpdate
                    const arr: any[] = obj[propKey] = [];
                    // Merge rows
                    for (const subRow of subRows) {
                        if (subRow[trgCol] === obj[keyCol]) {
                            arr.push(subRow);
                            subRows.delete(subRow);
                        }
                    }
                }
            } else if (prop.node) {
                await this.iterateForOne2Many(prop.node, connection);
            }

        }
    }

    private transformRow(executor: QueryExecutor, fields: FieldInfoMap, row: any[]): any {
        // Cache keys for better performance
        const elementKeys = this.elementKeys;
        const elementLen = elementKeys.length;
        const result = {};
        for (let elIdx = 0; elIdx < elementLen; elIdx++) {
            const elKey = elementKeys[elIdx];
            const prop = this._properties[elKey];
            if (isDataColumn(prop.element)) {
                const field = fields.get(prop.fieldAlias);
                if (field) {
                    let v = row[field.index];
                    if (typeof prop.element.parse === 'function')
                        v = prop.element.parse(v, prop.element, result);
                    if (v !== null)
                        result[elKey] = v;
                }
            } else if (isOne2ManyEagerProperty(prop)) {
                // One2Many Eager element
                // Keep a list of key field/value pairs to fetch rows for eager relation
                const _params = prop.eagerParams = prop.eagerParams || {};
                const f = fields.get(prop.fieldAlias);
                const v = f && row[f.index];
                if (v != null) {
                    _params[prop.fieldAlias] = _params[prop.fieldAlias] || [];
                    _params[prop.fieldAlias].push(v);
                }
                prop.eagerTargets = prop.eagerTargets || [];
                prop.eagerTargets.push(result);
            } else if (prop.node) {
                result[elKey] = prop.node.transformRow(executor, fields, row);
            }
        }

        Object.setPrototypeOf(result, this.entity.ctor.prototype);
        Object.defineProperty(result, Symbol.for('connection'), {
            enumerable: false,
            configurable: true,
            value: executor
        })
        return result;
    }

}
