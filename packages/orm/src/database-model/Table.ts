import type {Schema} from './Schema';
import {EntityOptions, EntityType} from '../types';

export class Table {

    clazz: any;

    constructor(public readonly schema: Schema,
                public type: EntityType,
                public name: string,
                options: EntityOptions) {
    }

}
