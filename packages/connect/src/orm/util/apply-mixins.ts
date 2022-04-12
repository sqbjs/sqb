export function applyMixins(derivedCtor: any, baseCtor: any, filter?: (k: string) => boolean) {
    for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
        if (filter && !filter(name))
            continue;
        Object.defineProperty(
            derivedCtor.prototype,
            name,
            Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
            Object.create(null)
        );
    }
}
