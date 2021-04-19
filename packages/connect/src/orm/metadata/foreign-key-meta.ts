import {camelCase} from 'putil-varhelpers';
import {ConstructorThunk, ForeignKeyOptions} from '../types';
import {resolveEntityMeta} from '../helpers';
import {EntityMeta} from './entity-meta';
import {ColumnElementMeta, isColumnElement} from './column-element-meta';

export class ForeignKeyMeta {
    private _keyColumn?: string | null; // cached value for auto determined keyColumn
    private _targetColumn?: string | null; // cached value for auto determined targetColumn
    entity: EntityMeta;
    target: ConstructorThunk;
    name?: string;
    display: string;
    keyColumn?: string;
    targetColumn?: string;

    constructor(entity: EntityMeta, target: ConstructorThunk, display: string,
                options?: ForeignKeyOptions) {
        this.entity = entity;
        this.target = target;
        this.display = display;
        this.name = options?.name;
        this.keyColumn = options?.keyColumn;
        this.targetColumn = options?.targetColumn;
    }

    async resolveTarget(): Promise<EntityMeta> {
        const target = await resolveEntityMeta(this.target);
        if (target)
            return target;
        throw new Error(`Can't resolve target entity of "${this.display}`);
    }

    async resolveKeyColumn(): Promise<ColumnElementMeta> {
        const n = await this.resolveKeyColumnName();
        const col = this.entity.getElement(n);
        if (!col)
            throw new Error(`Can't resolve keyColumn of ${this.display}. ` +
                `${this.entity.name} has no element named "${n}"`);
        if (!isColumnElement(col))
            throw new Error(`Can't resolve keyColumn of ${this.display}. ` +
                `${this.entity.name}.${n} is not a data column`);
        return col;
    }

    async resolveKeyColumnName(): Promise<string> {
        let keyColumn = this.keyColumn || this._keyColumn;
        if (keyColumn)
            return keyColumn;
        const target = await this.resolveTarget();

        // detect keyColumn using entity's foreign keys
        for (const fk of this.entity.foreignKeys) {
            if (fk === this)
                continue;
            const trg = await fk.resolveTarget();
            if (trg && trg.ctor === target.ctor) {
                keyColumn = await fk.resolveKeyColumnName();
                return this._keyColumn = keyColumn;
            }
        }

        // detect keyColumn using target's foreign keys
        for (const fk of target.foreignKeys) {
            const trg = await fk.resolveTarget();
            if (trg && trg.ctor === this.entity.ctor) {
                keyColumn = await fk.resolveTargetColumnName();
                return this._keyColumn = keyColumn;
            }
        }

        // detect keyColumn using target's primary column if not explicitly defined
        const primaryIndex = target.primaryIndex;
        const idColumn = primaryIndex && primaryIndex.columns.length === 1 ?
            primaryIndex.columns[0] : 'id';

        // snake-case
        keyColumn = target.name[0].toLowerCase() + target.name.substring(1) + '_' + idColumn;
        if (this.entity.getColumnElement(keyColumn))
            return this._keyColumn = keyColumn;
        keyColumn = camelCase(keyColumn);
        if (this.entity.getColumnElement(keyColumn))
            return this._keyColumn = keyColumn;

        throw new Error(`Can't detect keyColumn of ${this.display}`);
    }

    async resolveTargetColumn(): Promise<ColumnElementMeta> {
        const target = await this.resolveTarget();
        const n = await this.resolveTargetColumnName();
        const col = target.getElement(n);
        if (!col)
            throw new Error(`Can't resolve targetColumn of ${this.display}. ` +
                `${target.name} has no element named "${n}"`);
        if (!isColumnElement(col))
            throw new Error(`Can't resolve targetColumn of ${this.display}. ` +
                `${target.name}.${n} is not a data column`);
        return col;
    }

    async resolveTargetColumnName(): Promise<string> {
        let targetColumn = this.targetColumn || this._targetColumn;
        if (targetColumn)
            return targetColumn;
        const target = await this.resolveTarget();

        // detect targetColumn using entity's foreign keys
        for (const fk of this.entity.foreignKeys) {
            if (fk === this)
                continue;
            const trg = await fk.resolveTarget();
            if (trg && trg.ctor === target.ctor) {
                targetColumn = await fk.resolveTargetColumnName();
                return this._targetColumn = targetColumn;
            }
        }

        // detect targetColumn using target's foreign keys
        for (const fk of target.foreignKeys) {
            const trg = await fk.resolveTarget();
            if (trg && trg.ctor === this.entity.ctor) {
                targetColumn = await fk.resolveKeyColumnName();
                return this._targetColumn = targetColumn;
            }
        }

        if (target.primaryIndex && target.primaryIndex.columns.length === 1) {
            targetColumn = target.primaryIndex.columns[0];
            if (targetColumn && target.getColumnElement(targetColumn))
                return this._targetColumn = targetColumn;
        }

        throw new Error(`Can't detect targetColumn of ${this.display}`);

    }


}
