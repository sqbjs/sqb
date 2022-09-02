import {SerializerExtension} from './types.js';

export let serializers: SerializerExtension[] = [];

export function registerSerializer(...extension: SerializerExtension[]): void {
    for (const ext of extension) {
    if (!ext.dialect)
        throw new TypeError('A SerializerExtension must contain "dialect" property');
    serializers.push(ext);
}
}

export function unRegisterSerializer(...extension: SerializerExtension[]) {
    serializers = serializers.filter(x => !extension.includes(x))
}
