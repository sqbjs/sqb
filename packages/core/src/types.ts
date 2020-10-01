import {ParamType} from './enums';

export interface SerializerExtension {
    dialect: string;
    serialize?: SerializeFunction;
    // stringify?: (x: any) => string;
    isReservedWord?: IsReservedWordFunction;
}

export interface GenerateOptions {
    /**
     * Dialect that query to be generated for. Etc: postgres, oracle, sqlite ...
     */
    dialect?: string;
    prettyPrint?: boolean;
    paramType?: ParamType;
    values?: Record<string, any>;
}

export interface SerializeContext extends GenerateOptions {
    serializeHooks?: Function[];
    // prmValue?: any;
    query: GenerateResult;
}



export interface GenerateResult {
    sql: string;
    values?: any;
}

export interface ReturningData {
    field: string;
    dataType: string;
    table?: string;
    schema?: string;
    alias?: string;
}

export type SerializeFunction = (ctx: SerializeContext, type: string, obj,
                                 defFn: (ctx: SerializeContext, o: any) => string) => string;
export type IsReservedWordFunction = (ctx: SerializeContext, s: string) => boolean;
