export type Maybe<T> = T | undefined;

export interface Type<T = any> extends Function {
    new(...args: any[]): T;
}

type IfEquals<X, Y, A = X, B = never> =
    (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;

export type NonFunctionKeys<T> = {
    [K in keyof T]-?: T[K] extends Function ? never : K;
}[keyof T];

export type NonReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

export type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];

export type WritableKeys<T> = Exclude<NonFunctionKeys<T>, ReadonlyKeys<T>>;

export type PickWritable<T> = Pick<T, WritableKeys<T>>;

export type PartialWritable<T> = Partial<PickWritable<T>>;

type StringKeys<T> = Extract<keyof T, string | symbol>;

export interface TypedEventEmitter<T> {
    addListener<K extends StringKeys<T>>(event: K, listener: (...args: any[]) => void): this;
    // addListener<K extends keyof T>(event: K, listener: T[K]): this;
/*
    removeListener<K extends keyof T>(event: K, listener: (v: T[K]) => void): this;

    on<K extends keyof T>(event: K, listener: (v: T[K]) => void);

    once<K extends keyof T>(event: K, listener: (v: T[K]) => void);

    off<K extends keyof T>(event: K, listener: (v: T[K]) => void);

    removeAllListeners<K extends keyof T>(s: K);

    listeners<K extends keyof T>(event: K): Function[];

    rawListeners<K extends keyof T>(event: K): Function[];

    listenerCount<K extends keyof T>(event: K): number;

    prependListener<K extends keyof T>(event: K, listener: (v: T[K]) => void);

    prependOnceListener<K extends keyof T>(event: K, listener: (v: T[K]) => void);

 */
}
