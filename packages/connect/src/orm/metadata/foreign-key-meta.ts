import {ConstructorThunk, ForeignKeyOptions} from '../types';
import {EntityMeta} from './entity-meta';
import {AssociationResolver} from '../association-resolver';

export class ForeignKeyMeta {
    association: AssociationResolver;
    name?: string;

    constructor(readonly entity: EntityMeta, target: ConstructorThunk, display: string,
                options?: ForeignKeyOptions) {
        this.association = new AssociationResolver(display, entity.ctor, target,
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
