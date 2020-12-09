import {Adapter, RowType} from '@sqb/connect';
import {SqlJs} from 'sql.js/module';
import Statement = SqlJs.Statement;

export class SqljsCursor implements Adapter.Cursor {
    private _stmt?: Statement;
    private readonly _rowType: RowType;

    constructor(stmt: Statement, opts: {
        rowType: RowType;
    }) {
        this._rowType = opts.rowType;
        this._stmt = stmt;
    }

    get isClosed() {
        return !this._stmt;
    }

    get rowType(): RowType {
        return this._rowType;
    }

    async close(): Promise<void> {
        if (!this._stmt)
            return;
        this._stmt.free();
        this._stmt = undefined;
    }

    async fetch(nRows: number): Promise<any[] | undefined> {
        if (!this._stmt)
            return;
        const stmt = this._stmt;
        const rows: any[] = [];
        while (nRows-- && stmt.step()) {
            rows.push(this.rowType === 'object' ? stmt.getAsObject() : stmt.get());
        }
        return rows;
    }

}
