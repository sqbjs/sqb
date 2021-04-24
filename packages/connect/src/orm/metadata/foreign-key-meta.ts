import {ConstructorThunk, ForeignKeyOptions} from '../types';
import {EntityMeta} from './entity-meta';
import {Association} from '../association';

export class ForeignKeyMeta {
    association: Association;
    name?: string;

    constructor(readonly entity: EntityMeta, target: ConstructorThunk, display: string,
                options?: ForeignKeyOptions) {
        this.association = new Association(display, entity.ctor, target,
            options?.keyColumn, options?.targetColumn);
        this.name = options?.name;
    }

    get target(): ConstructorThunk {
        return this.association.target;
    }

    get display(): string {
        return this.association.name;
    }

    get keyColumn(): string | undefined {
        return this.association.sourceColumn;
    }

    get targetColumn(): string | undefined {
        return this.association.targetColumn;
    }

}
