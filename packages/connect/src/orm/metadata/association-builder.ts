import {AssociationKind, ConstructorResolver} from '../types';
import {Type} from '../../types';
import {AssociationNode} from './association-node';

export class AssociationBuilder<T> {
    first: AssociationNode;
    current: AssociationNode;

    constructor(public target: Type<T> | ConstructorResolver<T>,
                kind: AssociationKind,
                targetColumn?: keyof T,
                sourceColumn?: string) {
        this.first = this.current = new AssociationNode('', kind,
            null as unknown as Type,
            target);
        this.first.targetColumn = targetColumn as string;
        this.first.sourceColumn = sourceColumn as string;
    }

    ifTarget(conditions: object | object[]): this {
        this.current.targetConditions = this.current.targetConditions || [];
        if (Array.isArray(conditions))
            this.current.targetConditions.push(...conditions);
        else this.current.targetConditions.push(conditions)
        return this;
    }

    ifParent(conditions: object | object[]): this {
        this.current.parentConditions = this.current.parentConditions || [];
        if (Array.isArray(conditions))
            this.current.parentConditions.push(...conditions);
        else this.current.parentConditions.push(conditions)
        return this;
    }

    hasOne<K>(target: Type<K> | ConstructorResolver<K>,
              targetColumn?: keyof K,
              parentColumn?: keyof T): AssociationBuilder<K> {
        return this._newNode(target, 'has-one', targetColumn, parentColumn);
    }

    hasMany<K>(target: Type<K> | ConstructorResolver<K>,
               targetColumn?: keyof K,
               parentColumn?: keyof T): AssociationBuilder<K> {
        return this._newNode(target, 'has-many', targetColumn, parentColumn);
    }

    belongsTo<K>(target: Type<K> | ConstructorResolver<K>,
                 targetColumn?: keyof K,
                 parentColumn?: keyof T): AssociationBuilder<K> {
        return this._newNode(target, 'belongs-to', targetColumn, parentColumn);
    }

    belongsMany<K>(target: Type<K> | ConstructorResolver<K>,
                   targetColumn?: keyof K,
                   parentColumn?: keyof T): AssociationBuilder<K> {
        return this._newNode(target, 'belongs-to-many', targetColumn, parentColumn);
    }

    private _newNode<K>(target: Type<K> | ConstructorResolver<K>,
                        kind: AssociationKind,
                        targetColumn?: keyof K,
                        parentColumn?: keyof T): AssociationBuilder<K> {
        const child = new AssociationNode(
            this.current.name,
            kind,
            this.current.target, target,
            parentColumn as string,
            targetColumn as string);
        child.prior = this.current;
        this.current.next = child;
        this.current = child;
        return this as unknown as AssociationBuilder<K>;
    }


}

