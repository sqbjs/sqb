export type Maybe<T> = T | undefined;

export interface Type<T = any> {
    new(...args: any[]): T;
}

export declare type Primitive = string | number | boolean | bigint | symbol | undefined | null;
export declare type Builtin = Primitive | Function | Date | Error | RegExp;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IsTuple<T> = T extends [infer A]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ? T : T extends [infer A, infer B]
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ? T : T extends [infer A, infer B, infer C]
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ? T : T extends [infer A, infer B, infer C, infer D]
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ? T : T extends [infer A, infer B, infer C, infer D, infer E]
                    ? T : never;

type IfEquals<X, Y, A = X, B = never> =
    (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;

// Excludes function properties and symbol keys
export type DataKeys<T> = Exclude<{
    [K in keyof T]-?: T[K] extends Function ? never : K;
}[keyof T], '[unknown]'>;

export type ReadonlyKeys<T> = {
    [K in keyof T]-?: IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, never, K>
}[keyof T];


export type MutableKeys<T> = Exclude<DataKeys<T>, ReadonlyKeys<T>>;
export type ImmutableKeys<T> = Extract<DataKeys<T>, ReadonlyKeys<T>>;
export type PickMutable<T> = Pick<T, MutableKeys<T>>;
export type PickImmutable<T> = Pick<T, ImmutableKeys<T>>;

/** Like Partial but recursive */
export type DeepPartial<T> = T extends Builtin ? T
    : T extends Map<infer K, infer V> ? Map<K, DeepPartial<V>>
        : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<K, DeepPartial<V>>
            : T extends WeakMap<infer K, infer V> ? WeakMap<K, DeepPartial<V>>
                : T extends Set<infer U> ? Set<DeepPartial<U>>
                    : T extends ReadonlySet<infer U> ? ReadonlySet<DeepPartial<U>>
                        : T extends WeakSet<infer U> ? WeakSet<DeepPartial<U>>
                            : T extends (infer U)[] ? T extends IsTuple<T>
                                    ? { [K in keyof T]?: DeepPartial<T[K]> } : (DeepPartial<U>)[]
                                : T extends Promise<infer U> ? Promise<DeepPartial<U>>
                                    : Partial<T>;

/** Like PickMutable but recursive */
export type DeepPickMutable<T> =
    T extends Builtin ? T
        : T extends Map<infer K, infer V> ? Map<K, DeepPickMutable<V>>
            : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<K, DeepPickMutable<V>>
                : T extends WeakMap<infer K, infer V> ? WeakMap<K, DeepPickMutable<V>>
                    : T extends Set<infer U> ? Set<DeepPickMutable<U>>
                        : T extends ReadonlySet<infer U> ? ReadonlySet<DeepPickMutable<U>>
                            : T extends WeakSet<infer U> ? WeakSet<DeepPickMutable<U>>
                                : T extends (infer U)[] ? T extends IsTuple<T>
                                        ? { [K in MutableKeys<T>]?: DeepPickMutable<T[K]> } : (DeepPickMutable<U>)[]
                                    : T extends Promise<infer U> ? Promise<DeepPickMutable<U>>
                                        : T extends {} ? { [K in MutableKeys<T>]?: DeepPickMutable<T[K]> }
                                            : PickMutable<T>;

export type InstanceValues<T> = DeepPartial<DeepPickMutable<T>>;
