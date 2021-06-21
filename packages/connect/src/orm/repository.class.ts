import {SqbClient} from '../client/SqbClient';
import {SqbConnection} from '../client/SqbConnection';
import {EntityModel} from './model/entity-model';
import {QueryExecutor} from '../client/types';
import {Maybe, PartialWritable} from '../types';
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
        connection?: QueryExecutor;
    }

    export interface CountOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }

    export interface ExistsOptions extends CommandOptions {
        filter?: any;
        params?: any;
    }

    export interface DestroyAllOptions extends CommandOptions {
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
    private readonly _connection: QueryExecutor;
    private readonly _entity: EntityModel;

    constructor(entityDef: EntityModel, executor: SqbClient | SqbConnection) {
        this._connection = executor;
        this._entity = entityDef;
    }

    async create(values: PartialWritable<T>,
                 options?: Repository.CommandOptions): Promise<T> {
        const keyValues = await CreateCommand.execute({
            entity: this._entity,
            connection: this._connection,
            ...options,
            values,
            returning: true
        });
        const result = keyValues && (await this.findByPk(keyValues));
        if (!result)
            throw new Error('Unable to insert new row');
        return result;
    }

    async createOnly(values: PartialWritable<T>,
                     options?: Repository.CommandOptions): Promise<void> {
        await CreateCommand.execute({
            entity: this._entity,
            connection: this._connection,
            ...options,
            values,
            returning: false
        });
    }

    async exists(keyValue: any, options?: Repository.ExistsOptions): Promise<boolean> {
        const keyValues = extractKeyValues(this._entity, keyValue);
        const filter = [keyValues];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        return !!(await CountCommand.execute({
            connection: this._connection,
            ...options,
            filter,
            entity: this._entity
        }));
    }

    count(options?: Repository.CountOptions): Promise<number> {
        return CountCommand.execute({
            connection: this._connection,
            ...options,
            entity: this._entity
        });
    }

    async findAll(options?: Repository.FindAllOptions): Promise<T[]> {
        return await FindCommand.execute({
            connection: this._connection,
            ...options,
            entity: this._entity,
        });
    }

    async findOne(options?: Repository.FindOneOptions): Promise<Maybe<T>> {
        const rows = await FindCommand.execute({
            connection: this._connection,
            ...options,
            entity: this._entity,
            limit: 1
        });
        return rows && rows[0];
    }

    async findByPk(keyValue: any, options?: Repository.GetOptions): Promise<Maybe<T>> {
        const opts: Repository.FindAllOptions = {...options};
        opts.filter = [extractKeyValues(this._entity, keyValue)];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                opts.filter.push(...options.filter);
            else opts.filter.push(options.filter);
        }
        delete opts.offset;
        return await this.findOne(opts);
    }

    async destroy(keyValue: any, options?: Repository.CommandOptions): Promise<boolean> {
        return !!(await DestroyCommand.execute({
            connection: this._connection,
            ...options,
            entity: this._entity,
            filter: extractKeyValues(this._entity, keyValue)
        }));
    }

    async destroyAll(options?: Repository.DestroyAllOptions): Promise<number> {
        return DestroyCommand.execute({
            connection: this._connection,
            ...options,
            entity: this._entity,
            filter: options?.filter,
            params: options?.params
        });
    }

    async update(values: PartialWritable<T>,
                 options?: Repository.UpdateOptions): Promise<T | undefined> {

        const keyValues = await this._update(values, options);
        if (keyValues)
            return this.findByPk(keyValues);
    }

    async updateOnly(values: PartialWritable<T>,
                     options?: Repository.UpdateOptions): Promise<any> {
        return !!(await this._update(values, options));
    }

    async updateAll(values: PartialWritable<T>,
                    options?: Repository.UpdateAllOptions): Promise<number> {
        return await UpdateCommand.execute({
            entity: this._entity,
            connection: this._connection,
            ...options,
            values
        });
    }

    protected async _update(values: PartialWritable<T>,
                            options?: Repository.UpdateOptions): Promise<any> {
        const primaryKeys = this._entity.primaryIndex?.columns;
        if (!(primaryKeys && primaryKeys.length))
            throw new Error(`To run the update command, You must define primary key(s) for ${this._entity.ctor.name} entity.`);

        const keyValues = extractKeyValues(this._entity, values);
        const filter = [keyValues];
        if (options && options.filter) {
            if (Array.isArray(options.filter))
                filter.push(...options.filter);
            else filter.push(options.filter);
        }
        const updateValues = {...values};
        primaryKeys.forEach(k => delete updateValues[k]);

        const rowsAffected = await UpdateCommand.execute({
            entity: this._entity,
            connection: this._connection,
            ...options,
            values: updateValues,
            filter
        });
        return rowsAffected ? keyValues : undefined;
    }

}
