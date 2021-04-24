import {camelCase} from 'putil-varhelpers';
import {ConstructorThunk} from './types';
import {isColumnElement, resolveEntityMeta} from './helpers';
import type {EntityMeta} from './metadata/entity-meta';
import type {ColumnElementMeta} from './metadata/column-element-meta';

export class Association {
    private _keyColumn?: string | null; // cached value for auto determined keyColumn
    private _targetColumn?: string | null; // cached value for auto determined targetColumn

    constructor(public name: string,
                public source: ConstructorThunk,
                public target: ConstructorThunk,
                public sourceColumn?: string,
                public targetColumn?: string) {
    }

    async resolveSource(): Promise<EntityMeta> {
        const source = await resolveEntityMeta(this.source);
        if (source)
            return source;
        throw new Error(`Can't resolve source entity of "${this.name}`);
    }

    async resolveTarget(): Promise<EntityMeta> {
        const target = await resolveEntityMeta(this.target);
        if (target)
            return target;
        throw new Error(`Can't resolve target entity of "${this.name}`);
    }

    async resolveSourceColumn(): Promise<ColumnElementMeta> {
        const source = await this.resolveSource();
        const n = await this.resolveSourceColumnName();
        const col = source.getElement(n);
        if (!col)
            throw new Error(`Can't resolve keyColumn of ${this.name}. ` +
                `${source.name} has no element named "${n}"`);
        if (!isColumnElement(col))
            throw new Error(`Can't resolve keyColumn of ${this.name}. ` +
                `${source.name}.${n} is not a data column`);
        return col;
    }

    async resolveSourceColumnName(): Promise<string> {
        let keyColumn = this.sourceColumn || this._keyColumn;
        if (keyColumn)
            return keyColumn;
        const source = await this.resolveSource();
        const target = await this.resolveTarget();

        // detect keyColumn using entity's foreign keys
        for (const fk of source.foreignKeys) {
            if (fk.association === this)
                continue;
            const trg = await fk.association.resolveTarget();
            if (trg && trg.ctor === target.ctor) {
                keyColumn = await fk.association.resolveSourceColumnName();
                return this._keyColumn = keyColumn;
            }
        }

        // detect keyColumn using target's foreign keys
        for (const fk of target.foreignKeys) {
            const trg = await fk.association.resolveTarget();
            if (trg && trg.ctor === source.ctor) {
                keyColumn = await fk.association.resolveTargetColumnName();
                return this._keyColumn = keyColumn;
            }
        }

        // detect keyColumn using target's primary column if not explicitly defined
        const primaryIndex = target.primaryIndex;
        const idColumn = primaryIndex && primaryIndex.columns.length === 1 ?
            primaryIndex.columns[0] : 'id';

        // snake-case
        keyColumn = target.name[0].toLowerCase() + target.name.substring(1) + '_' + idColumn;
        if (source.getColumnElement(keyColumn))
            return this._keyColumn = keyColumn;
        keyColumn = camelCase(keyColumn);
        if (source.getColumnElement(keyColumn))
            return this._keyColumn = keyColumn;

        throw new Error(`Can't detect keyColumn of ${this.name}`);
    }

    async resolveTargetColumn(): Promise<ColumnElementMeta> {
        const target = await this.resolveTarget();
        const n = await this.resolveTargetColumnName();
        const col = target.getElement(n);
        if (!col)
            throw new Error(`Can't resolve targetColumn of ${this.name}. ` +
                `${target.name} has no element named "${n}"`);
        if (!isColumnElement(col))
            throw new Error(`Can't resolve targetColumn of ${this.name}. ` +
                `${target.name}.${n} is not a data column`);
        return col;
    }

    async resolveTargetColumnName(): Promise<string> {
        let targetColumn = this.targetColumn || this._targetColumn;
        if (targetColumn)
            return targetColumn;
        const source = await this.resolveSource();
        const target = await this.resolveTarget();

        // detect targetColumn using entity's foreign keys
        for (const fk of source.foreignKeys) {
            if (fk.association === this)
                continue;
            const trg = await fk.association.resolveTarget();
            if (trg && trg.ctor === target.ctor) {
                targetColumn = await fk.association.resolveTargetColumnName();
                return this._targetColumn = targetColumn;
            }
        }

        // detect targetColumn using target's foreign keys
        for (const fk of target.foreignKeys) {
            const trg = await fk.association.resolveTarget();
            if (trg && trg.ctor === source.ctor) {
                targetColumn = await fk.association.resolveSourceColumnName();
                return this._targetColumn = targetColumn;
            }
        }

        if (target.primaryIndex && target.primaryIndex.columns.length === 1) {
            targetColumn = target.primaryIndex.columns[0];
            if (targetColumn && target.getColumnElement(targetColumn))
                return this._targetColumn = targetColumn;
        }

        throw new Error(`Can't detect targetColumn of ${this.name}`);

    }

}
