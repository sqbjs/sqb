export type EntityType = 'table' | 'procedure';

export interface EntityOptions {
    type?: EntityType;
    name?: string;
}
