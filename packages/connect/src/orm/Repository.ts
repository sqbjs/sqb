import {Operator, Eq, And} from '@sqb/builder';
import {Client} from '../client/Client';
import {Connection} from '../client/Connection';
import {Constructor, FindByPkOptions, FindOneOptions, FindOptions} from './types';
import {EntityDefinition} from './definition/EntityDefinition';
import {QueryExecutor} from '../client/types';
import {Maybe} from '../types';
import {isDataColumn} from './definition/ColumnDefinition';
import {FindTask} from './FindTask';

export class Repository<T> {
    private readonly _client: Client;
    private readonly _executor: QueryExecutor;
    private readonly _entityDef: EntityDefinition;
    private readonly _ctor: Constructor;

    constructor(client: Client | Connection, ctor: Constructor) {
        if (client instanceof Client) {
            this._client = client;
            this._executor = client;
        } else {
            this._executor = client;
            this._client = client.client;
        }
        this._ctor = ctor;
        this._entityDef = EntityDefinition.get(ctor);
    }

    async find(options?: FindOptions): Promise<T[]> {
        const task = new FindTask<T>(this._executor, this._ctor);
        return task.execute(options);
    }

    async findByPk(keyValue: any | Record<string, any>, options?: FindByPkOptions): Promise<Maybe<T>> {
        const opts: FindOptions = {...options};
        opts.filter = [this._getPrimaryKeyConditions(keyValue)];
        opts.limit = 1;
        delete opts.offset;
        const rows = await this.find(opts);
        return rows && rows[0];
    }

    async findOne(options?: FindOneOptions): Promise<Maybe<T>> {
        const opts: FindOptions = {...options};
        opts.limit = 1;
        const rows = await this.find(opts);
        return rows && rows[0];
    }

    private _getPrimaryKeyConditions(keyValue: any | Record<string, any>): Operator {
        const entityDef = this._entityDef;
        const primaryIndex = entityDef.primaryIndex;
        if (!primaryIndex)
            throw new Error(`no primary fields defined for "${entityDef.name}" entity`);

        // if entities primary key has more than one key field
        if (Array.isArray(primaryIndex.column) && primaryIndex.column.length > 1) {
            if (typeof keyValue !== 'object')
                throw new Error(`"${this._entityDef.name}" entity` +
                    ` has more than one primary key field and you must provide all values with an key/value pair`);

            const keyColumns = primaryIndex.column;

            //
            const valueKeys = Object.keys(keyValue);
            const valueKeysLower = valueKeys.map(x => x.toLowerCase());

            const out: Operator[] = [];
            for (let k of keyColumns) {
                k = k.toLowerCase();
                const i = valueKeysLower.indexOf(k);
                if (i < 0)
                    throw new Error(`Value of key field "${this._entityDef.name}.${k}" required to perform this operation`);
                // const col = entityDef.getColumn(k);
                // eslint-disable-next-line
                console.log(k);
            }
            return And(...out);
        }

        const col = entityDef.getColumn(primaryIndex.column as string);
        if (!isDataColumn(col))
            throw new Error(`Primary column for "${entityDef.name}" entity not found`);
        return Eq(col.fieldName, keyValue);
    }

}
