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

export type PickReadonly<T> = Pick<T, ReadonlyKeys<T>>;

export type PartialWritable<T> = Partial<PickWritable<T>>;
