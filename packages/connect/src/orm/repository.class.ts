import {SqbClient} from '../client/SqbClient';
import {SqbConnection} from '../client/SqbConnection';
import {EntityModel} from './model/entity-model';
import {TransactionFunction} from '../client/types';
import {Maybe, PartialWritable, Type} from '../types';
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
        filter?: any;
        params?: any;
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
        filter?: any;
        params?: any;
    }

    export interface UpdateOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }

    export interface UpdateAllOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }
}

export class Repository<T> {
    private readonly _executor: SqbClient | SqbConnection;
    private readonly _entity: EntityModel;
    private readonly _schema?: string

    constructor(entityDef: EntityModel, executor: SqbClient | SqbConnection, schema?: string) {
        this._executor = executor;
        this._entity = entityDef;
        this._schema = schema;
    }

    get type(): Type<T> {
        return this._entity.ctor;
    }

    create(values: PartialWritable<T>,
           options?: Repository.CreateOptions): Promise<T> {
        return this._execute(async (connection) => {
            return this._create(values, {...options, connection});
        }, options);
    }

    createOnly(values: PartialWritable<T>,
               options?: Repository.CreateOptions): Promise<void> {
        return this._execute(async (connection) => {
            return this._createOnly(values, {...options, connection});
        }, options);
    }

    exists(keyValue: any, options?: Repository.ExistsOptions): Promise<boolean> {
        return this._execute(async (connection) => {
            return this._exists(keyValue, {...options, connection});
        }, options);
    }

    count(options?: Repository.CountOptions): Promise<number> {
        return this._execute(async (connection) => {
            return this._count({...options, connection});
        }, options);
    }

    findAll(options?: Repository.FindAllOptions): Promise<T[]> {
        return this._execute(async (connection) => {
            return this._findAll({...options, connection});
        }, options);
    }

    findOne(options?: Repository.FindOneOptions): Promise<Maybe<T>> {
        return this._execute(async (connection) => {
            return this._findOne({...options, connection});
        }, options);
    }

    findByPk(keyValue: any, options?: Repository.GetOptions): Promise<Maybe<T>> {
        return this._execute(async (connection) => {
            return this._findByPk(keyValue, {...options, connection});
        }, options);
    }

    destroy(keyValue: any, options?: Repository.DestroyOptions): Promise<boolean> {
        return this._execute(async (connection) => {
            return this._destroy(keyValue, {...options, connection});
        }, options);
    }

    destroyAll(options?: Repository.DestroyOptions): Promise<number> {
        return this._execute(async (connection) => {
            return this._destroyAll({...options, connection});
        }, options);
    }

    update(values: PartialWritable<T>,
           options?: Repository.UpdateOptions): Promise<T | undefined> {
        return this._execute(async (connection) => {
            const opts = {...options, connection};
            const keyValues = await this._update(values, opts);
            if (keyValues)
                return this._findByPk(keyValues, opts);
        }, options);
    }

    updateOnly(values: PartialWritable<T>,
               options?: Repository.UpdateOptions): Promise<any> {
        return this._execute(async (connection) => {
            return !!(await this._update(values, {...options, connection}));
        }, options);
    }

    updateAll(values: PartialWritable<T>,
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
            return fn(conn);
        });
    }

    protected async _create(values: PartialWritable<T>,
                            options: Repository.CreateOptions & { connection: SqbConnection }): Promise<T> {
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

    protected async _createOnly(values: PartialWritable<T>,
                                options: Repository.CreateOptions & { connection: SqbConnection }): Promise<void> {
        await CreateCommand.execute({
            ...options,
            entity: this._entity,
            values,
            returning: false
        });
    }

    protected async _exists(keyValue: any,
                            options: Repository.ExistsOptions & { connection: SqbConnection }): Promise<boolean> {
        const keyValues = extractKeyValues(this._entity, keyValue);
        const filter = [keyValues];
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

    protected async _findAll(options: Repository.FindAllOptions & { connection: SqbConnection }): Promise<T[]> {
        return await FindCommand.execute({
            ...options,
            entity: this._entity,
        });
    }

    protected async _findOne(options: Repository.FindOneOptions & { connection: SqbConnection }): Promise<Maybe<T>> {
        const rows = await FindCommand.execute({
            ...options,
            entity: this._entity,
            limit: 1
        });
        return rows && rows[0];
    }

    protected async _findByPk(keyValue: any,
                              options: Repository.GetOptions & { connection: SqbConnection }): Promise<Maybe<T>> {
        const opts: Repository.FindAllOptions & { connection: SqbConnection } = {...options};
        opts.filter = [extractKeyValues(this._entity, keyValue)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                opts.filter.push(...options.filter);
            else opts.filter.push(options.filter);
        }
        delete opts.offset;
        return await this._findOne(opts);
    }

    protected async _destroy(keyValue: any,
                             options: Repository.DestroyOptions & { connection: SqbConnection }): Promise<boolean> {
        const keyValues = extractKeyValues(this._entity, keyValue);
        const filter = [keyValues];
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

    protected async _update(values: PartialWritable<T>,
                            options: Repository.UpdateOptions & { connection: SqbConnection }): Promise<any> {
        const primaryKeys = this._entity.primaryIndex?.columns;
        if (!(primaryKeys && primaryKeys.length))
            throw new Error(`To run the update command, You must define primary key(s) for ${this._entity.ctor.name} entity.`);

        const keyValues = extractKeyValues(this._entity, values);
        const filter = [keyValues];
        if (options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        const updateValues = {...values};
        primaryKeys.forEach(k => delete updateValues[k]);
        const rowsAffected = await UpdateCommand.execute({
            ...options,
            entity: this._entity,
            values: updateValues,
            filter
        });
        return rowsAffected ? keyValues : undefined;
    }

    protected async _updateAll(values: PartialWritable<T>,
                               options: Repository.UpdateAllOptions & { connection: SqbConnection }): Promise<number> {
        return await UpdateCommand.execute({
            ...options,
            entity: this._entity,
            values
        });
    }

}