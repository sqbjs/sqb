import {classes} from '@sqb/builder';
import {
    ClientConfiguration,
    QueryRequest,
    RowType,
    DataType
} from './types';
import {Maybe} from '../types';

export interface Adapter {
    driver: string;
    dialect: string;
    features?: {
        cursor?: boolean;
        schema?: boolean;
        fetchAsString?: DataType[];
    };
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
        setSchema?: (schema: string) => Promise<void>;
        getSchema?: () => Promise<string>;
        onGenerateQuery?: (request: QueryRequest, query: classes.Query) => void;
    }

    export interface Cursor {
        readonly isClosed: boolean;
        readonly rowType: RowType;
        close: () => Promise<void>;
        fetch: (rows: number) => Promise<Maybe<any[]>>;
    }

    export interface Response {
        fields?: Field[];
        rows?: Record<string, any>[] | any[][];
        rowType?: RowType;
        cursor?: Adapter.Cursor;
        rowsAffected?: number;
    }

    export interface Field {
        fieldName: string;
        dataType: string;
        jsType: string;
        isArray?: boolean;
        elementDataType?: string;
        nullable?: boolean;
        fixedLength?: boolean;
        size?: number;
        precision?: number;
        _inf: any;
    }

}
