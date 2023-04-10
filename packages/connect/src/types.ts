import {Builtin, DeepPickWritable} from 'ts-gems';

export type EntityInput<T> = DeepNullablePartial<DeepPickWritable<T>>;
export type EntityOutput<T> = DeepPartial<T>;

export type DeepNullablePartial<T> = _DeepNullablePartial<T>;
type _DeepNullablePartial<T> =
    T extends Builtin ? T
        : T extends Promise<infer U> ? Promise<DeepNullablePartial<U>>
            : T extends (infer U)[] ? DeepNullablePartial<U>[]
                : { [P in keyof T]?: DeepNullablePartial<Exclude<T[P], undefined>> | null };

export type DeepPartial<T> = _DeepPartial<T>;
type _DeepPartial<T> =
    T extends Builtin ? T
        : T extends Promise<infer U> ? Promise<DeepPartial<U>>
            : T extends (infer U)[] ? DeepPartial<U>[]
                : { [P in keyof T]?: DeepPartial<Exclude<T[P], undefined>>};
