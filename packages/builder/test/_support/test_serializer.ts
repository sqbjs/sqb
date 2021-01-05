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

    private _serializeParameter(ctx: SerializeContext, o: any): Maybe<string> {
        const prmValue = ctx.values && ctx.values[o.name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[o.name] = prmValue;
        return '::' + o.name;
    }

}
