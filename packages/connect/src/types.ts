import { DeepPickWritable, HighDeepNullish } from 'ts-gems';

export type PartialInput<T> = HighDeepNullish<DeepPickWritable<T>>;
export type PartialOutput<T> = HighDeepNullish<T>;

export type EntityInput<T> = PartialInput<T>;
export type EntityOutput<T> = PartialOutput<T>;
