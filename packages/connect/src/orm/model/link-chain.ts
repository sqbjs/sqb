import {AssociationKind, TypeResolver, TypeThunk} from '../orm.type';
import {Type} from '../../types';
import {AssociationNode} from './association-node';

export class LinkChain<T> {
    first: AssociationNode;
    current: AssociationNode;

    constructor(public target: TypeThunk<T>,
                kind: AssociationKind,
                targetKey?: keyof T,
                sourceKey?: string) {
        this.first = this.current = new AssociationNode('', {
            kind,
            target,
            source: null as unknown as Type,
            sourceKey,
            targetKey: targetKey as string
        });
    }

    where(conditions: object | object[]): this {
        this.current.conditions = this.current.conditions || [];
        if (Array.isArray(conditions))
            this.current.conditions.push(...conditions);
        else this.current.conditions.push(conditions)
        return this;
    }

    linkToOne<K>(target: Type<K> | TypeResolver<K>,
                 targetColumn?: keyof K,
                 parentColumn?: keyof T): LinkChain<K> {
        return this._newNode(target, 'to', targetColumn, parentColumn);
    }

    linkToMany<K>(target: Type<K> | TypeResolver<K>,
                  targetColumn?: keyof K,
                  parentColumn?: keyof T): LinkChain<K> {
        return this._newNode(target, 'to-many', targetColumn, parentColumn);
    }

    linkFromOne<K>(target: Type<K> | TypeResolver<K>,
                   targetColumn?: keyof K,
                   parentColumn?: keyof T): LinkChain<K> {
        return this._newNode(target, 'from', targetColumn, parentColumn);
    }

    linkFromMany<K>(target: Type<K> | TypeResolver<K>,
                    targetColumn?: keyof K,
                    parentColumn?: keyof T): LinkChain<K> {
        return this._newNode(target, 'from-many', targetColumn, parentColumn);
    }

    private _newNode<K>(target: Type<K> | TypeResolver<K>,
                        kind: AssociationKind,
                        targetKey?: keyof K,
                        parentKey?: keyof T): LinkChain<K> {
        const child = new AssociationNode(
            this.current.name,
            {
                kind,
                source: this.current.target,
                target,
                sourceKey: parentKey as string,
                targetKey: targetKey as string
            });
        child.prior = this.current;
        this.current.next = child;
        this.current = child;
        return this as unknown as LinkChain<K>;
    }


}

