import {SerializationType} from '../enums';
import {Serializable} from '../Serializable';
import {SerializeContext} from '../SerializeContext';

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
        return ctx.serialize(this._type, this._text, () => this._text);
    }
}
