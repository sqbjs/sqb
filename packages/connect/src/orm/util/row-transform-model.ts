import type {QueryExecutor} from '../../client/types';
import type {FieldInfoMap} from '../../client/FieldInfoMap';
import type {EntityMeta} from '../metadata/entity-meta';
import type {EntityElementMeta} from '../metadata/entity-element-meta';
import {isRelationElement, RelationElementMeta} from '../metadata/relation-element-meta';
import {DataColumnMeta, isDataColumn} from '../metadata/data-column-meta';
import {EmbeddedElementMeta} from '../metadata/embedded-element-meta';
import {FindCommandArgs} from '../commands/find.command';

export interface RowTransformElement {
    column: EntityElementMeta;
    fieldAlias: string;
    node?: RowTransformModel;
    prepareOptions?: Omit<FindCommandArgs, 'entity' | 'connection'>;
    eagerParams?: any;
}

export class RowTransformModel {
    entity: EntityMeta;
    private _elements: Record<string, RowTransformElement> = {};
    private _elementKeys?: string[];

    constructor(entity: EntityMeta) {
        this.entity = entity;
    }

    addDataElement(col: DataColumnMeta, fieldAlias: string) {
        this._elements[col.name] = {
            column: col,
            fieldAlias
        };
        this._elementKeys = undefined;
    }

    addOne2ManyEagerElement(col: RelationElementMeta,
                            fieldAlias: string,
                            prepareOptions?: Omit<FindCommandArgs, 'entity' | 'connection'>) {
        this._elements[col.name] = {
            column: col,
            fieldAlias,
            prepareOptions
        };
        this._elementKeys = undefined;
    }

    addNode(col: EmbeddedElementMeta | RelationElementMeta, node: RowTransformModel) {
        this._elements[col.name] = {
            column: col,
            fieldAlias: '',
            node
        };
        this._elementKeys = undefined;
    }

    get elementKeys(): string[] {
        if (!this._elementKeys)
            this._elementKeys = Object.keys(this._elements);
        return this._elementKeys;
    }

    async transformRows(connection: QueryExecutor, fields: FieldInfoMap, rows: any): Promise<any> {
        const rowLen = rows.length;
        const result: any[] = [];
        for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
            const o = await this.transformRow(connection, fields, rows[rowIdx]);
            result.push(o);
        }
        if (!this.elementKeys)
            return result;

        // Fetch one-2-many related rows and merge with result rows
        const elementLen = this.elementKeys.length;
        for (let elIdx = 0; elIdx < elementLen; elIdx++) {
            const elKey = this.elementKeys[elIdx];
            const el = this._elements[elKey];

            if (el.column && el.prepareOptions && isRelationElement(el.column) && !el.column.lazy) {
                const {FindCommand} = await import('../commands/find.command');
                const prepareOptions = el.prepareOptions;
                const targetEntity = await el.column.foreign.resolveTarget();
                const r = await FindCommand.execute({
                    ...prepareOptions,
                    entity: targetEntity,
                    connection,
                    limit: prepareOptions.maxEagerFetch,
                    params: el.eagerParams
                });
                const subRows = new Set(r);

                const keyCol = await el.column.foreign.resolveKeyColumnName();
                const trgCol = await el.column.foreign.resolveTargetColumnName();

                // init array value for column
                for (const row of result) {
                    row[elKey] = [];
                }
                // Merge rows
                const rowCount = result.length;
                let row;
                for (let i = 0; i < rowCount; i++) {
                    row = result[i];
                    for (const subRow of subRows) {
                        if (subRow[trgCol] === row[keyCol]) {
                            row[elKey].push(subRow);
                            subRows.delete(subRow);
                        }
                    }
                }
            }
        }
        return result;
    }

    transformRow(executor: QueryExecutor, fields: FieldInfoMap, row: any[]): any {
        // Cache keys for better performance
        const elementKeys = this.elementKeys;
        const elementLen = elementKeys.length;
        const result = {};
        for (let elIdx = 0; elIdx < elementLen; elIdx++) {
            const elKey = elementKeys[elIdx];
            const el = this._elements[elKey];
            if (isDataColumn(el.column)) {
                const field = fields.get(el.fieldAlias);
                if (field) {
                    let v = row[field.index];
                    if (typeof el.column.parse === 'function')
                        v = el.column.parse(v, el.column, result);
                    if (v !== null)
                        result[elKey] = v;
                }
            } else if (el.node) {
                result[elKey] = el.node.transformRow(executor, fields, row);
            } else if (el.column && el.prepareOptions && isRelationElement(el.column) && !el.column.lazy) {
                // One2Many Eager element
                // Keep a list of key field/value pairs to fetch rows for eager relation
                const _params = el.eagerParams = el.eagerParams || {};
                const f = fields.get(el.fieldAlias);
                const v = f && row[f.index];
                if (v != null) {
                    _params[el.fieldAlias] = _params[el.fieldAlias] || [];
                    _params[el.fieldAlias].push(v);
                }
            }
        }

        Object.setPrototypeOf(result, this.entity.ctor.prototype);
        Object.defineProperty(result, Symbol.for('connection'), {
            enumerable: false,
            configurable: true,
            value: executor
        })
        return result;
    }

}
