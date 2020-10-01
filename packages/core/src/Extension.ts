import {SerializerExtension} from './types';

export class Extension {

    private static _serializers: SerializerExtension[] = [];

    static registerSerializer(...extension: SerializerExtension[]): void {
        for (const ext of extension) {
            if (!ext.dialect)
                throw new TypeError('A SerializerExtension must contain "dialect" property');
            this._serializers.push(ext);
        }
    }

    static unRegisterSerializer(...extension: SerializerExtension[]) {
        this._serializers = this._serializers.filter(x => !extension.includes(x))
    }

    static get serializers(): SerializerExtension[] {
        return this._serializers;
    }
}
