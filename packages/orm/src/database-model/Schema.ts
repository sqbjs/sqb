import {Table} from './Table';
import type {DatabaseModel} from './DatabaseModel';

export class Schema {
    private _tables: Record<string, Table> = {};

    constructor(public readonly database: DatabaseModel,
                public readonly name?: string) {
    }

    getTable(name: string): Table {
        return this._tables[name];
    }

    addTable(table: Table) {

    }

}
