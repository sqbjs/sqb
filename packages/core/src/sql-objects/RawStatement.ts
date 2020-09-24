import {Serializable, serializeFallback} from '../Serializable';
import {SerializationType} from '../enums';
import {SerializeContext} from '../interfaces';

export class RawStatement extends Serializable {

    _text: string;

    constructor(str: string) {
        super();
        this._text = str;
    }

    get _type(): SerializationType {
        return SerializationType.RAW;
    }

    _serialize(ctx: SerializeContext): string {
        return serializeFallback(ctx, this._type, this._text, () => this._text);
    }
}
