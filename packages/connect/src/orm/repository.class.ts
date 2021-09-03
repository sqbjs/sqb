import {AsyncEventEmitter} from 'strict-typed-events';
import {SqbClient} from '../client/SqbClient';
import {SqbConnection} from '../client/SqbConnection';
import {EntityModel} from './model/entity-model';
import {QueryRequest, TransactionFunction} from '../client/types';
import {InstanceValues, Type, DeepPartial} from '../types';
import {extractKeyValues} from './util/extract-keyvalues';
import {CountCommand} from './commands/count.command';
import {CreateCommand} from './commands/create.command';
import {FindCommand} from './commands/find.command';
import {DestroyCommand} from './commands/destroy.command';
import {UpdateCommand} from './commands/update.command';
import {FieldInfoMap} from '../client/FieldInfoMap';

export namespace Repository {

    export type TransformRowFunction = (fields: FieldInfoMap, row: object, obj: object) => void;

    export interface CommandOptions {
        connection?: SqbConnection;
    }

    export interface CreateOptions extends CommandOptions {
        elements?: string[];
        include?: string[];
        exclude?: string[];
    }

    export interface CountOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }

    export interface ExistsOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }

    export interface DestroyOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }

    export interface FindOneOptions extends CommandOptions {
        elements?: string[];
        include?: string[];
        exclude?: string[];
        filter?: any;
        params?: any;
        sort?: string[];
        offset?: number;
        distinct?: boolean;
        onTransformRow?: TransformRowFunction;
    }

    export interface FindAllOptions extends FindOneOptions {
        limit?: number;
        maxEagerFetch?: number;
        maxSubQueries?: number;
    }

    export interface GetOptions extends CommandOptions {
        elements?: string[];
        include?: string[];
        exclude?: string[];
        filter?: any;
        params?: any;
    }

    export interface UpdateOptions extends CommandOptions {
        elements?: string[];
        include?: string[];
        exclude?: string[];
        filter?: any;
        params?: any;
    }

    export interface UpdateAllOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }
}

interface RepositoryEvents {
    execute: (request: QueryRequest, connection: SqbConnection) => void;
    error: (error: Error, connection: SqbConnection) => void;
    acquire: (connection: SqbConnection) => void;
}

export class Repository<T> extends AsyncEventEmitter<RepositoryEvents> {
    private readonly _executor: SqbClient | SqbConnection;
    private readonly _entity: EntityModel;
    private readonly _schema?: string;

    constructor(entityDef: EntityModel, executor: SqbClient | SqbConnection, schema?: string) {
        super();
        this._executor = executor;
        this._entity = entityDef;
        this._schema = schema;
    }

    get entity(): EntityModel {
        return this._entity;
    }

    get type(): Type<T> {
        return this._entity.ctor;
    }

    create(values: InstanceValues<T>, options?: Repository.CreateOptions): Promise<DeepPartial<T>> {
        return this._execute(async (connection) => {
            return this._create(values, {...options, connection});
        }, options);
    }

    createOnly(values: InstanceValues<T>, options?: Repository.CreateOptions): Promise<void> {
        return this._execute(async (connection) => {
            return this._createOnly(values, {...options, connection});
        }, options);
    }

    exists(keyValue: any | Record<string, any>, options?: Repository.ExistsOptions): Promise<boolean> {
        return this._execute(async (connection) => {
            return this._exists(keyValue, {...options, connection});
        }, options);
    }

    count(options?: Repository.CountOptions): Promise<number> {
        return this._execute(async (connection) => {
            return this._count({...options, connection});
        }, options);
    }

    findAll(options?: Repository.FindAllOptions): Promise<DeepPartial<T>[]> {
        return this._execute(async (connection) => {
            return this._findAll({...options, connection});
        }, options);
    }

    findOne(options?: Repository.FindOneOptions): Promise<DeepPartial<T> | undefined> {
        return this._execute(async (connection) => {
            return this._findOne({...options, connection});
        }, options);
    }

    findByPk(keyValue: any | Record<string, any>, options?: Repository.GetOptions): Promise<DeepPartial<T> | undefined> {
        return this._execute(async (connection) => {
            return this._findByPk(keyValue, {...options, connection});
        }, options);
    }

    destroy(keyValue: any | Record<string, any>, options?: Repository.DestroyOptions): Promise<boolean> {
        return this._execute(async (connection) => {
            return this._destroy(keyValue, {...options, connection});
        }, options);
    }

    destroyAll(options?: Repository.DestroyOptions): Promise<number> {
        return this._execute(async (connection) => {
            return this._destroyAll({...options, connection});
        }, options);
    }

    update(keyValue: any | Record<string, any>, values: InstanceValues<T>,
           options?: Repository.UpdateOptions): Promise<DeepPartial<T> | undefined> {
        return this._execute(async (connection) => {
            const opts = {...options, connection};
            const keyValues = await this._update(keyValue, values, opts);
            if (keyValues)
                return this._findByPk(keyValues, opts);
        }, options);
    }

    updateOnly(keyValue: any | Record<string, any>, values: InstanceValues<T>,
               options?: Repository.UpdateOptions): Promise<DeepPartial<T>> {
        return this._execute(async (connection) => {
            return !!(await this._update(keyValue, values, {...options, connection}));
        }, options);
    }

    updateAll(values: InstanceValues<T>,
              options?: Repository.UpdateAllOptions): Promise<number> {
        return this._execute(async (connection) => {
            return this._updateAll(values, {...options, connection});
        })
    }

    protected async _execute(fn: TransactionFunction,
                             opts?: Repository.CommandOptions): Promise<any> {
        let connection = opts?.connection;
        if (!connection && this._executor instanceof SqbConnection)
            connection = this._executor;
        if (connection) {
            if (this._schema)
                await connection.setSchema(this._schema);
            return fn(connection);
        }
        return (this._executor as SqbClient).acquire(async (conn) => {
            if (this._schema)
                await conn.setSchema(this._schema);
            await this.emitAsync({event: 'acquire', serial: true}, conn);
            return fn(conn);
        });
    }

    protected async _create(values: InstanceValues<T>,
                            options: Repository.CreateOptions & { connection: SqbConnection }): Promise<DeepPartial<T>> {
        const keyValues = await CreateCommand.execute({
            ...options,
            entity: this._entity,
            values,
            returning: true
        });
        const result = keyValues && (await this.findByPk(keyValues, options));
        if (!result)
            throw new Error('Unable to insert new row');
        return result;
    }

    protected async _createOnly(values: InstanceValues<T>,
                                options: Repository.CreateOptions & { connection: SqbConnection }): Promise<void> {
        await CreateCommand.execute({
            ...options,
            entity: this._entity,
            values,
            returning: false
        });
    }

    protected async _exists(keyValue: any | Record<string, any>,
                            options: Repository.ExistsOptions & { connection: SqbConnection }): Promise<boolean> {
        const filter = [extractKeyValues(this._entity, keyValue, true)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        return !!(await CountCommand.execute({
            ...options,
            filter,
            entity: this._entity
        }));
    }

    protected async _count(options: Repository.CountOptions & { connection: SqbConnection }): Promise<number> {
        return CountCommand.execute({
            ...options,
            entity: this._entity
        });
    }

    protected async _findAll(options: Repository.FindAllOptions & { connection: SqbConnection }): Promise<DeepPartial<T>[]> {
        return await FindCommand.execute({
            ...options,
            entity: this._entity,
        });
    }

    protected async _findOne(options: Repository.FindOneOptions & { connection: SqbConnection }): Promise<DeepPartial<T> | undefined> {
        const rows = await FindCommand.execute({
            ...options,
            entity: this._entity,
            limit: 1
        });
        return rows && rows[0];
    }

    protected async _findByPk(keyValue: any | Record<string, any>,
                              options: Repository.GetOptions & { connection: SqbConnection }): Promise<DeepPartial<T> | undefined> {
        const filter = [extractKeyValues(this._entity, keyValue, true)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        return await this._findOne({...options, filter, offset: 0});
    }

    protected async _destroy(keyValue: any | Record<string, any>,
                             options: Repository.DestroyOptions & { connection: SqbConnection }): Promise<boolean> {
        const filter = [extractKeyValues(this._entity, keyValue, true)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        return !!(await DestroyCommand.execute({
            ...options,
            filter,
            entity: this._entity,
        }));
    }

    protected async _destroyAll(options: Repository.DestroyOptions & { connection: SqbConnection }): Promise<number> {
        return DestroyCommand.execute({
            ...options,
            entity: this._entity,
            filter: options?.filter,
            params: options?.params
        });
    }

    protected async _update(keyValue: any | Record<string, any>,
                            values: InstanceValues<T>,
                            options: Repository.UpdateOptions & { connection: SqbConnection }): Promise<Record<string, any> | undefined> {
        const keyValues = extractKeyValues(this._entity, keyValue, true);
        const filter = [keyValues];
        if (options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        const updateValues = {...values};
        Object.keys(keyValues).forEach(k => delete updateValues[k]);
        const rowsAffected = await UpdateCommand.execute({
            ...options,
            entity: this._entity,
            values: updateValues,
            filter
        });
        return rowsAffected ? keyValues : undefined;
    }

    protected async _updateAll(values: InstanceValues<T>,
                               options: Repository.UpdateAllOptions & { connection: SqbConnection }): Promise<number> {
        return await UpdateCommand.execute({
            ...options,
            entity: this._entity,
            values
        });
    }

}
