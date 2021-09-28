import {DeepPartial, DeepPickWritable} from 'ts-gems';

export type InstanceValues<T> = DeepPartial<DeepPickWritable<T>>;

