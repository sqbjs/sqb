import {
    Operator
} from '@sqb/builder';
// noinspection ES6PreferShortImport
import {SqbClient} from '../client/SqbClient';
import {SqbConnection} from '../client/SqbConnection';
// noinspection ES6PreferShortImport
import {EntityDefinition} from './EntityDefinition';
import {QueryExecutor} from '../client/types';
import {Maybe, PartialWritable} from '../types';
import {extractKeyValues} from './commands/keyvalues.helper';
import {count} from './commands/count.command';
import {create, createRaw} from './commands/create.command';
import {findAll} from './commands/find.command';
import {destroyAll} from './commands/destroy.command';
import {update, updateAllRaw} from './commands/update.command';

export namespace Repository {

    export type SearchFilter = object | Operator | (object | Operator)[];

    export interface CountOptions {
        filter?: SearchFilter;
        params?: any;
    }

    export interface GetOptions {
        columns?: string[];
    }

    export interface FindOneOptions {
        columns?: string[];
        filter?: SearchFilter;
        params?: any;
        sort?: string[];
        offset?: number;
    }

    export interface FindAllOptions extends FindOneOptions {
        limit?: number;
        maxEagerFetch?: number;
    }

    export interface DestroyAllOptions {
        filter?: SearchFilter;
        params?: any;
    }

    export interface UpdateAllOptions {
        filter?: SearchFilter;
        params?: any;
    }
}

export class Repository<T> {
    private readonly _executor: QueryExecutor;
    private readonly _entityDef: EntityDefinition;

    constructor(entityDef: EntityDefinition, executor: SqbClient | SqbConnection) {
        this._executor = executor;
        this._entityDef = entityDef;
    }

    async create(values: PartialWritable<T>): Promise<T> {
        return create<T>({
            executor: this._executor,
            entityDef: this._entityDef,
            values,
            returnAutoGeneratedColumns: true
        });
    }

    async createOnly(values: PartialWritable<T>): Promise<void> {
        await createRaw<T>({
            executor: this._executor,
            entityDef: this._entityDef,
            values
        });
    }

    count(options?: Repository.CountOptions): Promise<number> {
        return count({
            executor: this._executor,
            entityDef: this._entityDef,
            filter: options?.filter,
            params: options?.params
        });
    }

    findAll(options?: Repository.FindAllOptions): Promise<T[]> {
        return findAll({
            ...options,
            executor: this._executor,
            entityDef: this._entityDef
        });
    }

    async findOne(options?: Repository.FindOneOptions): Promise<Maybe<T>> {
        const rows = await findAll({
            ...options,
            limit: 1,
            executor: this._executor,
            entityDef: this._entityDef
        });
        return rows && rows[0];
    }

    async findByPk(keyValue: T | any | Record<string, any>,
                   options?: Repository.GetOptions): Promise<Maybe<T>> {
        const opts: Repository.FindAllOptions = {...options};
        opts.filter = [extractKeyValues(this._entityDef, keyValue)];
        delete opts.offset;
        return await this.findOne(opts);
    }

    async destroy(keyValue: T | any | Record<string, any>): Promise<boolean> {
        return !!(await destroyAll({
            executor: this._executor,
            entityDef: this._entityDef,
            filter: extractKeyValues(this._entityDef, keyValue)
        }));
    }

    async destroyAll(options?: Repository.DestroyAllOptions): Promise<number> {
        return destroyAll({
            executor: this._executor,
            entityDef: this._entityDef,
            filter: options?.filter,
            params: options?.params
        });
    }

    async update(values: PartialWritable<T>): Promise<Partial<T> | undefined> {
        return update({
            executor: this._executor,
            entityDef: this._entityDef,
            values,
            returnAutoGeneratedColumns: true
        });
    }

    async updateOnly(values: PartialWritable<T>): Promise<boolean> {
        const x = await update({
            executor: this._executor,
            entityDef: this._entityDef,
            values,
            returnAutoGeneratedColumns: false
        })
        return !!x;
    }

    async updateAll(values: PartialWritable<T>, options?: Repository.UpdateAllOptions): Promise<number> {
        const r = await updateAllRaw<T>({
            executor: this._executor,
            entityDef: this._entityDef,
            values,
            filter: options?.filter,
            params: options?.params
        });
        return (r && r.rowsAffected) || 0;
    }

}
