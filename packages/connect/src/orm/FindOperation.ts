import {Constructor, FindOptions} from './types';
import {EntityDefinition} from './definition/EntityDefinition';
import {Select} from '@sqb/builder';
import {QueryExecutor} from '../client/types';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

export class FindOperation<T> {

    private readonly _executor: QueryExecutor;
    private readonly _ctor: Constructor;
    private readonly _entityDef: EntityDefinition;
    private readonly _options: FindOptions;

    constructor(executor: QueryExecutor, ctor: Constructor, opts: FindOptions) {
        this._executor = executor;
        this._ctor = ctor;
        this._entityDef = EntityDefinition.get(ctor);
        this._options = opts;
    }

    async execute(): Promise<T[]> {
        const entityDef = this._entityDef;
        const queryFields: string[] = [];

        // Prepare an array for requested fields
        const requestedElements = this._options.elements ?
            this._options.elements.map(x => x.toUpperCase()) : undefined;

        const aliases: any = {};
        for (const col of entityDef.columns.values()) {
            const alias = col.name.toUpperCase();
            if (requestedElements && !requestedElements.includes(alias))
                continue;
            queryFields.push('t.' + col.fieldName + ' as ' + alias);
            aliases[alias] = col;
        }

        const query = Select(...queryFields).from(entityDef.tableName + ' t');
        if (this._options.filter)
            query.where(...this._options.filter);
        if (this._options.offset)
            query.offset(this._options.offset);
        if (this._options.sort) {
            query.orderBy(...this._prepareOrderColumns(this._options.sort));
        }

        // Execute query
        const resp = await this._executor.execute(query, {
            fetchRows: this._options.limit,
            objectRows: true,
            cursor: false,
            ignoreNulls: false,
            namingStrategy: (f: string) => {
                const col = aliases[f.toUpperCase()];
                return col && col.name;
            }
        });

        if (resp.rows) {
            const rows = resp.rows;
            const l = rows.length;
            for (let i = 0; i < l; i++) {
                Object.setPrototypeOf(rows[i], this._ctor.prototype);
            }
            return rows as T[];
        }
        return [];
    }

    private _prepareOrderColumns(sort: string[]): string[] {
        if (!sort)
            return [];
        const orderColumns: string[] = [];
        for (const item of sort) {
            const m = item.match(SORT_ORDER_PATTERN);
            if (!m)
                throw new Error(`"${item}" is not a valid order expression`);
            const colName = m[2];
            const col = this._entityDef.getColumn(colName);
            if (!col)
                throw new Error(`Unknown column (${m[1]}) declared in sort property`);
            const dir = m[1];
            if ((!dir || dir === '+') && !col.sortAscending)
                throw new Error(`Ascending sort on olumn "${colName}" is not allowed`);
            if ((!dir || dir === '-') && !col.sortDescending)
                throw new Error(`Descending sort on olumn "${colName}" is not allowed`);
            orderColumns.push((dir || '') + col.fieldName);
        }
        return orderColumns;
    }

}
