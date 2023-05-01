import {AsyncEventEmitter, TypedEventEmitterClass} from 'strict-typed-events';
import {StrictOmit, Type} from 'ts-gems';
import {FieldInfoMap} from '../client/field-info-map.js';
import {SqbClient} from '../client/sqb-client.js';
import {SqbConnection} from '../client/sqb-connection.js';
import {QueryRequest, TransactionFunction} from '../client/types.js';
import {EntityInput, EntityOutput} from '../types.js';
import {CountCommand} from './commands/count.command.js';
import {CreateCommand} from './commands/create.command.js';
import {DeleteCommand} from './commands/delete.command.js';
import {FindCommand} from './commands/find.command.js';
import {UpdateCommand} from './commands/update.command.js';
import {EntityMetadata} from './model/entity-metadata.js';
import {extractKeyValues} from './util/extract-keyvalues.js';

interface Projection {
    pick?: string[];
    omit?: string[];
    include?: string[];
}

interface Filtering {
    filter?: any;
    params?: any;
}

export namespace Repository {

    export type TransformRowFunction = (fields: FieldInfoMap, row: object, obj: object) => void;

    export interface CommandOptions {
        connection?: SqbConnection;
    }

    export interface CreateOptions extends CommandOptions, Projection {
    }

    export interface CountOptions extends CommandOptions, Filtering {
    }

    export interface ExistsOptions extends CommandOptions, Filtering {
    }

    export interface DeleteOptions extends CommandOptions, Filtering {
    }

    export interface DeleteManyOptions extends CommandOptions, Filtering {
    }

    export interface FindOptions extends CommandOptions, Projection, Filtering {
    }

    export interface FindOneOptions extends CommandOptions, Projection, Filtering {
        sort?: string[];
        offset?: number;
    }

    export interface FindManyOptions extends FindOneOptions {
        limit?: number;
        distinct?: boolean;
        maxEagerFetch?: number;
        maxSubQueries?: number;
        onTransformRow?: TransformRowFunction;
    }

    export interface UpdateOptions extends CommandOptions, Projection, Filtering {
    }

    export interface UpdateManyOptions extends CommandOptions, Filtering {
    }

    /**
     * @deprecated
     */
    export type FindAllOptions = FindManyOptions;
    /**
     * @deprecated
     */
    export type DestroyOptions = DeleteOptions;
    /**
     * @deprecated
     */
    export type UpdateAllOptions = UpdateManyOptions;
}

interface RepositoryEvents {
    execute: (request: QueryRequest) => void;
    error: (error: Error) => void;
    acquire: (connection: SqbConnection) => Promise<void>;
}

export class Repository<T> extends TypedEventEmitterClass<RepositoryEvents>(AsyncEventEmitter) {
    private readonly _executor: SqbClient | SqbConnection;
    private readonly _entity: EntityMetadata;
    private readonly _schema?: string;

    constructor(entityDef: EntityMetadata, executor: SqbClient | SqbConnection, schema?: string) {
        super();
        this._executor = executor;
        this._entity = entityDef;
        this._schema = schema;
    }

    get entity(): EntityMetadata {
        return this._entity;
    }

    get type(): Type<T> {
        return this._entity.ctor;
    }

    create(
        values: EntityInput<T>,
        options?: Repository.CreateOptions
    ): Promise<EntityOutput<T>> {
        return this._execute(async (connection) => {
            const keyValue = await this._create(values, {...options, connection, returning: true});
            const result = keyValue &&
                await this._find(keyValue, {...options, connection});
            if (!result)
                throw new Error('Unable to insert new row');
            return result;
        }, options);
    }

    createOnly(
        values: EntityInput<T>,
        options?: StrictOmit<Repository.CreateOptions, keyof Projection>
    ): Promise<void> {
        return this._execute(async (connection) => {
            await this._create(values, {...options, connection, returning: false});
        }, options);
    }

    exists(
        keyValue: any | Record<string, any>,
        options?: Repository.ExistsOptions
    ): Promise<boolean> {
        return this._execute(async (connection) => {
            return this._exists(keyValue, {...options, connection});
        }, options);
    }

    count(
        options?: Repository.CountOptions
    ): Promise<number> {
        return this._execute(async (connection) => {
            return this._count({...options, connection});
        }, options);
    }

    find(
        keyValue: any | Record<string, any>,
        options?: Repository.FindOptions
    ): Promise<EntityOutput<T> | undefined> {
        return this._execute(async (connection) => {
            return this._find(keyValue, {...options, connection});
        }, options);
    }

    findOne(
        options?: Repository.FindOneOptions
    ): Promise<EntityOutput<T> | undefined> {
        return this._execute(async (connection) => {
            return await this._findOne({
                ...options,
                connection,
            });
        }, options);
    }

    findMany(
        options?: Repository.FindManyOptions
    ): Promise<EntityOutput<T>[]> {
        return this._execute(async (connection) => {
            return this._findMany({...options, connection});
        }, options);
    }

    delete(
        keyValue: any | Record<string, any>,
        options?: Repository.DeleteOptions
    ): Promise<boolean> {
        return this._execute(async (connection) => {
            return this._delete(keyValue, {...options, connection});
        }, options);
    }

    deleteMany(
        options?: Repository.DeleteManyOptions
    ): Promise<number> {
        return this._execute(async (connection) => {
            return this._deleteMany({...options, connection});
        }, options);
    }

    update(
        keyValue: any | Record<string, any>,
        values: EntityInput<T>,
        options?: Repository.UpdateOptions
    ): Promise<EntityOutput<T> | undefined> {
        return this._execute(async (connection) => {
            const opts = {...options, connection};
            const keyValues = await this._updateByPk(keyValue, values, opts);
            if (keyValues)
                return this._find(keyValues, opts);
        }, options);
    }

    updateOnly(
        keyValue: any | Record<string, any>,
        values: EntityInput<T>,
        options?: StrictOmit<Repository.UpdateOptions, keyof Projection>
    ): Promise<boolean> {
        return this._execute(async (connection) => {
            return !!(await this._updateByPk(keyValue, values, {...options, connection}));
        }, options);
    }

    updateMany(
        values: EntityInput<T>,
        options?: Repository.UpdateManyOptions
    ): Promise<number> {
        return this._execute(async (connection) => {
            return this._updateAll(values, {...options, connection});
        })
    }

    /**
     *
     * @deprecated
     */
    destroy(keyValue: any | Record<string, any>, options?: Repository.DeleteOptions): Promise<boolean> {
        return this.deleteOne(keyValue, options);
    }

    /**
     *
     * @deprecated
     */
    destroyAll(options?: Repository.DeleteManyOptions): Promise<number> {
        return this.deleteMany(options);
    }

    /**
     *
     * @deprecated
     */
    findAll(options?: Repository.FindManyOptions): Promise<EntityOutput<T>[]> {
        return this.findMany(options);
    }


    /**
     *
     * @deprecated
     */
    updateAll(
        values: EntityInput<T>,
        options?: Repository.UpdateManyOptions
    ): Promise<number> {
        return this.updateMany(values, options);
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
            await this.emitAsyncSerial('acquire', conn);
            return fn(conn);
        });
    }

    protected async _create(
        values: EntityInput<T>,
        options: Repository.CreateOptions & {
            connection: SqbConnection,
            returning?: boolean
        }
    ): Promise<any> {
        if (!values)
            throw new TypeError('You must provide values');
        const keyValues = await CreateCommand.execute({
            ...options,
            entity: this._entity,
            values
        });
        if (options.returning && !keyValues)
            throw new Error('Unable to insert new row');
        return keyValues;
    }

    protected async _exists(
        keyValue: any | Record<string, any>,
        options: Repository.ExistsOptions & {
            connection: SqbConnection
        }
    ): Promise<boolean> {
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

    protected async _findMany(options: Repository.FindManyOptions & {
        connection: SqbConnection
    }): Promise<EntityOutput<T>[]> {
        return await FindCommand.execute({
            ...options,
            entity: this._entity,
        });
    }

    protected async _findOne(options: Repository.FindOneOptions & {
        connection: SqbConnection
    }): Promise<EntityOutput<T> | undefined> {
        const rows = await this._findMany({
            ...options,
            limit: 1
        });
        return rows && rows[0];
    }

    protected async _find(
        keyValue: any | Record<string, any>,
        options: Repository.FindOptions & {
            connection: SqbConnection
        }
    ): Promise<EntityOutput<T> | undefined> {
        const filter = [extractKeyValues(this._entity, keyValue, true)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        return await this._findOne({...options, filter, offset: 0});
    }

    protected async _delete(
        keyValue: any | Record<string, any>,
        options: Repository.DeleteOptions & {
            connection: SqbConnection
        }
    ): Promise<boolean> {
        const filter = [extractKeyValues(this._entity, keyValue, true)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        return !!(await DeleteCommand.execute({
            ...options,
            filter,
            entity: this._entity,
        }));
    }

    protected async _deleteMany(
        options: Repository.DeleteManyOptions & {
            connection: SqbConnection
        }
    ): Promise<number> {
        return DeleteCommand.execute({
            ...options,
            entity: this._entity,
            filter: options?.filter,
            params: options?.params
        });
    }

    protected async _updateByPk(
        keyValue: any | Record<string, any>,
        values: EntityInput<T>,
        options: Repository.UpdateOptions & {
            connection: SqbConnection
        }
    ): Promise<Record<string, any> | undefined> {
        if (!values)
            throw new TypeError('You must provide values');
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

    protected async _updateAll(
        values: EntityInput<T>,
        options: Repository.UpdateManyOptions & {
            connection: SqbConnection
        }
    ): Promise<number> {
        if (!values)
            throw new TypeError('You must provide values');
        return await UpdateCommand.execute({
            ...options,
            entity: this._entity,
            values
        });
    }

}
