import {Table} from './Table';

export class Schema {
    private static __schemas: Record<string, Schema> = {};
    private _tables: Table[] = [];
    public readonly token: string;

    constructor(public readonly databaseName: string,
                public readonly schemaName?: string) {
        this.token = Schema._getToken(databaseName, schemaName);
    }

    static get(databaseName?: string, schemaName?: string): Schema | undefined {
        return this.__schemas[Schema._getToken(databaseName, schemaName)];
    }

    static getOrInit(databaseName?: string, schemaName?: string): Schema {
        let schema = this.get(databaseName, schemaName);
        if (schema)
            return schema;
        schema = new Schema(databaseName, schemaName);
        this.__schemas[schema.token] = schema;
        return schema;
    }

    protected static _getToken(databaseName?: string, schemaName?: string): string {
        return databaseName + (schemaName ? '/' + schemaName : '');
    }

}
