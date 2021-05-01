import {camelCase} from 'putil-varhelpers';
import {ConstructorThunk} from './types';
import {isColumnElement, resolveEntityMeta} from './helpers';
import type {EntityMeta} from './metadata/entity-meta';
import type {ColumnElementMeta} from './metadata/column-element-meta';

export class AssociationResolver {
    private _sourceColumn?: string | null; // cached value
    private _targetColumn?: string | null; // cached value
    private _source?: EntityMeta;  // cached value
    private _target?: EntityMeta;  // cached value

    constructor(public name: string,
                public source: ConstructorThunk,
                public target: ConstructorThunk,
                public sourceColumn?: string,
                public targetColumn?: string,
                private _inverse?: boolean) {
    }

    async resolveSource(): Promise<EntityMeta> {
        this._source = this._source || await resolveEntityMeta(this.source);
        if (!this._source)
            throw new Error(`Can't resolve source entity of association "${this.name}"`);
        return this._source;
    }

    async resolveTarget(): Promise<EntityMeta> {
        this._target = this._target || await resolveEntityMeta(this.target);
        if (!this._target)
            throw new Error(`Can't resolve target entity of association "${this.name}"`);
        return this._target;
    }

    async resolveSourceColumn(): Promise<ColumnElementMeta> {
        const source = await this.resolveSource();
        const n = await this.resolveSourceColumnName();
        const col = source.getElement(n);
        if (!col)
            throw new Error(`Can't resolve link source column of ${this.name}. ` +
                `${source.name} has no element named "${n}"`);
        if (!isColumnElement(col))
            throw new Error(`Can't resolve link source column of ${this.name}. ` +
                `${source.name}.${n} is not a data column`);
        return col;
    }

    async resolveSourceColumnName(): Promise<string> {
        let sourceColumn = this.sourceColumn || this._sourceColumn;
        if (sourceColumn)
            return sourceColumn;
        const source = await this.resolveSource();
        const target = await this.resolveTarget();

        // detect keyColumn using entity's foreign keys
        for (const fk of source.foreignKeys) {
            if (fk.association === this)
                continue;
            const trg = await fk.association.resolveTarget();
            if (trg && trg.ctor === target.ctor) {
                sourceColumn = await fk.association.resolveSourceColumnName();
                return this._sourceColumn = sourceColumn;
            }
        }

        // detect keyColumn using target's foreign keys
        for (const fk of target.foreignKeys) {
            const trg = await fk.association.resolveTarget();
            if (trg && trg.ctor === source.ctor) {
                sourceColumn = await fk.association.resolveTargetColumnName();
                return this._sourceColumn = sourceColumn;
            }
        }

        // detect keyColumn using target's primary column if not explicitly defined
        const primaryIndex = target.primaryIndex;
        const idColumn = primaryIndex && primaryIndex.columns.length === 1 ?
            primaryIndex.columns[0] : 'id';

        // snake-case
        sourceColumn = target.name[0].toLowerCase() + target.name.substring(1) + '_' + idColumn;
        if (source.getColumnElement(sourceColumn))
            return this._sourceColumn = sourceColumn;
        sourceColumn = camelCase(sourceColumn);
        if (source.getColumnElement(sourceColumn))
            return this._sourceColumn = sourceColumn;

        throw new Error(`Can't detect link source column of ${this.name}`);
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
