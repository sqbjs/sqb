import {ConstructorResolver} from '../types';
import {Type} from '../../types';
import {Association} from '../association';

export class EntityChainRing extends Association {
    prior?: EntityChainRing;
    next?: EntityChainRing;
    targetConditions?: any[];
    parentConditions?: any[];

    getFirst(): EntityChainRing {
        let l: EntityChainRing = this;
        while (l.prior)
            l = l.prior;
        return l;
    }

    getLast(): EntityChainRing {
        let l: EntityChainRing = this;
        while (l.next)
            l = l.next;
        return l;
    }
}

export class EntityChainBuilder<T> {
    first: EntityChainRing;
    current: EntityChainRing;
    targetColumn?: keyof T;
    sourceColumn?: string;

    constructor(public target: Type<T> | ConstructorResolver<T>) {
        this.first = this.current = new EntityChainRing('',
            null as unknown as Type,
            target);
    }

    link(targetColumn?: keyof T,
         sourceColumn?: string): this {
        this.current.targetColumn = targetColumn as string;
        this.current.sourceColumn = sourceColumn as string;
        return this;
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

    chain<K>(target: Type<K> | ConstructorResolver<K>,
             targetColumn?: keyof K,
             parentColumn?: keyof T): EntityChainBuilder<K> {
        const child = new EntityChainRing(this.current.name,
            this.current.target, target,
            parentColumn as string,
            targetColumn as string);
        child.prior = this.current;
        this.current.next = child;
        this.current = child;
        return this as unknown as EntityChainBuilder<K>;
    }


}

