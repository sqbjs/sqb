import {ConnectionConfiguration, PreparedQuery, RowType} from './types';
import {ParamType} from '@sqb/core';

export interface Adapter {
    dialect: string;
    paramType: ParamType;
    connect: (config: ConnectionConfiguration) => Promise<Adapter.Session>;
}

export namespace Adapter {

    export type Response = SelectResponse | CursorResponse | UpdateResponse;

    export interface Session {
        sessionId: any;
        close: () => Promise<void>;
        reset: () => Promise<void>;
        startTransaction: () => Promise<void>;
        commit: () => Promise<void>;
        rollback: () => Promise<void>;
        ping: () => Promise<void>;
        execute: (prepared: PreparedQuery) => Promise<Response>;
    }

    export interface Cursor {
        close: () => Promise<void>;
        fetch: (rows: number) => Promise<any>;
    }

    export interface SelectResponse {
        fields: Record<string, FieldInfo> | FieldInfo[];
        rows: Record<string, any>[] | any[][];
        rowType: RowType;
    }

    export interface CursorResponse {
        fields: Record<string, FieldInfo> | FieldInfo[];
        cursor: Adapter.Cursor;
    }

    export interface UpdateResponse {
        returns?: any;
        rowsAffected?: number;
    }

    export interface FieldInfo {
        name: string;
    }
    
    export function isSelectResponse(source: any): source is SelectResponse {
        return typeof source.fields === 'object' &&
            typeof source.rows === 'object' &&
            (source.rowType === 'array' || source.rowType === 'object');
    }

    export function isUpdateResponse(source: any): source is UpdateResponse {
        return typeof source.rowsAffected === 'number';
    }

    export function isCursorResponse(source: any): source is CursorResponse {
        return typeof source.fields === 'object' &&
            typeof source.cursor === 'object';
    }
    
}
