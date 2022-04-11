import {SerializationType} from '../enums';
import {printArray} from '../helpers';
import {SerializeContext} from '../SerializeContext';
import {ReturningColumn} from '../sql-objects/ReturningColumn';
import {Query} from './Query';

export abstract class ReturningQuery extends Query {

    _returningColumns?: ReturningColumn[];

    /**
     *
     */
    returning(...columns: string[]): this {
        if (!columns)
            return this;
        // noinspection JSMismatchedCollectionQueryUpdate
        this._returningColumns = columns.length ?
            columns.reduce<ReturningColumn[]>((a, v) => {
                if (v)
                    a.push(new ReturningColumn(v));
                return a;
            }, []) : undefined;
        return this;
    }

    /**
     *
     */
    protected __serializeReturning(ctx: SerializeContext): string {
        if (!(this._returningColumns && this._returningColumns.length))
            return '';
        const arr: string[] = [];
        ctx.returningFields = [];
        for (const t of this._returningColumns) {
            const s = t._serialize(ctx);
            /* istanbul ignore else */
            if (s)
                arr.push(s);
        }
        return ctx.serialize(SerializationType.RETURNING_BLOCK, arr, () => {
            const s = printArray(arr);
            return s ? 'returning ' + s : '';
        });
    }

}
