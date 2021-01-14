import {SerializationType} from './enums';

export interface SerializerExtension {
    dialect: string;
    serialize?: SerializeFunction;
    isReservedWord?: IsReservedWordFunction;
}

export interface GenerateOptions {
    /**
     * Dialect that query to be generated for. Etc: postgres, oracle, sqlite ...
     */
    dialect?: string;
    prettyPrint?: boolean;
    values?: Record<string, any>;
    dialectVersion?: string;
}

export interface SerializeContext extends GenerateOptions {
    serializeHooks?: Function[];
    queryParams?: Record<string, any> | any[];
    returningFields?: { field: string, alias?: string }[];
}

export interface GenerateResult {
    sql: string;
    params?: any;
    returningFields?: { field: string, alias?: string }[];
}

export type SerializeFunction = (ctx: SerializeContext, type: SerializationType | string, obj: any,
                                 defFn: DefaultSerializeFunction) => string | undefined;
export type DefaultSerializeFunction = (ctx: SerializeContext, o: any) => string;
export type IsReservedWordFunction = (ctx: SerializeContext, s: string) => boolean;
