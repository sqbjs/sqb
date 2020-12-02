import {Schema} from './Schema';

export class DatabaseModel {

    private static __items: Record<string, DatabaseModel> = {};
    private static __default = new DatabaseModel();
    private _schemas: Record<string, Schema> = {};

    constructor(public readonly name: string = 'default') {
    }

    getSchema(name: string): Schema {
        return this._schemas[name];
    }

    obtainSchema(name: string): Schema {
        let schema = this.getSchema(name);
        if (schema)
            return schema;
        schema = new Schema(this, name);
        this._schemas[name] = schema;
        return schema;
    }

    static get(name?: string): DatabaseModel | undefined {
        return name ? this.__items[name] : this.__default;
    }

    static obtain(name?: string): DatabaseModel {
        let meta = this.get(name);
        if (meta)
            return meta;
        meta = new DatabaseModel(name);
        this.__items[meta.name] = meta;
        return meta;
    }

}
