import {Maybe, SerializationType, SerializeContext} from '@sqb/builder';

export class TestSerializer {

    dialect = 'test';

    serialize(ctx, type, o, defFn) {
        switch (type) {
            case SerializationType.EXTERNAL_PARAMETER:
                return this._serializeParameter(ctx, o);
        }
        return defFn(ctx, o);
    }

    isReservedWord() {
        return false;
    }

    private _serializeParameter(ctx: SerializeContext, name: string): Maybe<string> {
        const prmValue = ctx.values && ctx.values[name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[name] = prmValue;
        return '::' + name;
    }

}
