import {AssociationKind, ConstructorThunk} from '../types';
import {AssociationResolver} from '../association-resolver';

export class AssociationNode extends AssociationResolver {
    prior?: AssociationNode;
    next?: AssociationNode;
    targetConditions?: any[];
    parentConditions?: any[];

    constructor(public name: string,
                public kind: AssociationKind,
                public source: ConstructorThunk,
                public target: ConstructorThunk,
                public sourceColumn?: string,
                public targetColumn?: string) {
        super(name, source, target, sourceColumn, targetColumn,
            kind === 'belongs-to' || kind === 'belongs-to-many')
    }

    getFirst(): AssociationNode {
        let l: AssociationNode = this;
        while (l.prior)
            l = l.prior;
        return l;
    }

    getLast(): AssociationNode {
        let l: AssociationNode = this;
        while (l.next)
            l = l.next;
        return l;
    }

    returnsMany(): boolean {
        let n: AssociationNode | undefined = this;
        while (n) {
            if (n.kind === 'has-many' || n.kind === 'belongs-to-many')
                return true;
            n = n.next;
        }
        return false;
    }

}
