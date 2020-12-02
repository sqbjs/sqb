export class DatabaseMeta {

    private static __items: Record<string, DatabaseMeta> = {};
    private static __default = new DatabaseMeta();

    constructor(public readonly name: string = 'default') {
    }

    static get(name?: string, init?: boolean): DatabaseMeta | undefined {
        return name ? this.__items[name] : this.__default;
    }

    static getOrInit(name?: string): DatabaseMeta {
        let meta = this.get(name);
        if (meta)
            return meta;
        meta = new DatabaseMeta(name);
        this.__items[meta.name] = meta;
        return meta;
    }

}
