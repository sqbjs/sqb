import {ClientConfiguration, Maybe, QueryRequest, RowType} from './types';
import {classes} from '@sqb/builder';

export interface Adapter {
    driver: string;
    dialect: string;
    connect: (config: ClientConfiguration) => Promise<Adapter.Connection>;
}

export namespace Adapter {

    export interface Connection {
        sessionId: any;
        execute: (request: QueryRequest) => Promise<Response>;
        close: () => Promise<void>;
        reset: () => Promise<void>;
        test: () => Promise<void>;
        startTransaction: () => Promise<void>;
        commit: () => Promise<void>;
        rollback: () => Promise<void>;
        onGenerateQuery?: (request: QueryRequest, query: classes.Query) => void;
    }

    export interface Cursor {
        readonly isClosed: boolean;
        readonly rowType: RowType;
        close: () => Promise<void>;
        fetch: (rows: number) => Promise<Maybe<any[]>>;
    }

    export interface Response {
        fields?: Record<string, FieldInfo> | FieldInfo[];
        rows?: Record<string, any>[] | any[][];
        rowType?: RowType;
        cursor?: Adapter.Cursor;
        rowsAffected?: number;
    }

    export interface FieldInfo {
        index: number;
        fieldName: string;
        dataType: string;
        elementDataType?: string;
        jsType: string;
        isArray?: boolean;
        nullable?: boolean;
        fixedLength?: boolean;
        size?: number;
        precision?: number;
        _inf: any;
    }

}
