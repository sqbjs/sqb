import {ParamType} from './enums';

export interface Plugin {
    createAdapter?: (opts: any) => any;
    createMetaOperator?: (opts: any) => any;
    createSerializer?: (ctx: any) => any;
    stringify?: (x: any) => string;
    serialize?: SerializeFunction;
    isReserved?: IsReservedFunction;
    paramType?: ParamType;
}

export interface SerializeContext {
    paramType?: ParamType;
    plugin?: Plugin;
    serializeHooks?: Function[];
    values?: Record<string, any>;
    prmValue?: any;
    query?: any;
    prettyPrint?: boolean;
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
export type IsReservedFunction = (ctx: SerializeContext, s: string) => boolean;
