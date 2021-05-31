import {DefaultSerializeFunction, SerializeContext} from './types';
import {SerializationType} from './enums';
import {serializers} from './extensions';

export const ReservedWords = [
    'schema', 'table', 'field', 'index', 'foreign', 'key',
    'select', 'insert', 'update', 'delete', 'with', 'merge',
    'join', 'inner', 'outer', 'left', 'right', 'full',
    'from', 'where', 'order', 'by', 'group', 'having',
    'acs', 'ascending', 'dsc', 'descending', 'distinct',
    'and', 'or', 'not', 'between', 'null', 'like', 'ilike',
    'count', 'sum', 'average', 'avg', 'cascade', 'authorization',
    'create', 'add', 'drop', 'alter', 'index', 'private', 'sequence',
    'default', 'constraint', 'references', 'primary', 'foreign',
    'user', 'password'];

export abstract class Serializable {

    abstract _type: SerializationType;

    /**
     * Performs serialization
     */
    abstract _serialize(ctx: SerializeContext): string;

}

/**
 * Performs a fallback mechanism, tries hook functions, extension than default function to serialize
 */
export function serializeFallback(ctx: SerializeContext, type: string, o: any,
                                  defFn: DefaultSerializeFunction): string {
    if (ctx.serializeHooks) {
        for (const hook of ctx.serializeHooks) {
            const s = hook(ctx, type, o, defFn);
            if (s != null)
                return s;
        }
    }
    for (const ext of serializers) {
        if (ext.dialect === ctx.dialect && ext.serialize) {
            const s = ext.serialize(ctx, type, o, defFn);
            if (s != null)
                return s;
        }
    }
    return defFn(ctx, o);
}

/**
 * Serializes object
 */
export function serializeObject(ctx, v): string {
    if (v == null)
        return 'null';
    if (Array.isArray(v)) {
        let s = '';
        for (const [i, t] of v.entries()) {
            s += (i ? ',' : '') + serializeObject(ctx, t);
        }
        return '(' + s + ')';
    }
    if (typeof v === 'object') {
        if (v.isSerializable) {
            const s = v._serialize(ctx);
            return s ? (v.isQuery ? '(' + s + ')' : s) :
                /* istanbul ignore next */
                'null';
        }
        if (v instanceof Date) {
            return serializeFallback(ctx, SerializationType.DATE_VALUE, v,
                () => serializeDateValue(v));
        }
    }
    if (typeof v === 'string') {
        return serializeFallback(ctx, SerializationType.STRING_VALUE, v,
            () => serializeStringValue(v));
    }
    if (typeof v === 'boolean') {
        return serializeFallback(ctx, SerializationType.BOOLEAN_VALUE, v,
            () => serializeBooleanValue(v));
    }
    if (typeof v === 'number') {
        return serializeFallback(ctx, SerializationType.NUMBER_VALUE, v,
            () => serializeNumberValue(v));
    }
    if (v instanceof Serializable)
        return v._serialize(ctx);
    return v;
}

/**
 *
 */
export function serializeStringValue(val: string): string {
    return '\'' + String(val).replace(/'/g, '\'\'') + '\'';
}

/**
 *
 */
export function serializeBooleanValue(val: any): string {
    return val ? 'true' : 'false';
}

/**
 *
 */
export function serializeNumberValue(val: any): string {
    return '' + val;
}

/**
 *
 */
export function serializeDateValue(date: Date): string {
    const d = date.getUTCDate();
    const m = date.getUTCMonth() + 1;
    const y = date.getUTCFullYear();
    const h = date.getUTCHours();
    const n = date.getUTCMinutes();
    const s = date.getUTCSeconds();
    let str: string = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    /* istanbul ignore else */
    if (h + n + s)
        str += ' ' + (h <= 9 ? '0' + h : h) + ':' +
            (n <= 9 ? '0' + n : n) + ':' +
            (s <= 9 ? '0' + s : s);
    return '\'' + str + '\'';
}

/**
 * Prints array with line feeding
 */
export function printArray(arr: string[], sep?: string, lfLen?: number): string {
    let out = '';
    let line = '';
    let k = 0;
    lfLen = lfLen || 60;
    sep = sep || ',';
    for (const s of arr) {
        /* istanbul ignore next */
        if (s === undefined) continue;
        line += (k > 0 ? sep : '');
        if (line.length > lfLen) {
            out += (out ? '\n' : '') + line;
            line = '';
        } else line += line ? ' ' : '';
        line += s;
        k++;
    }
    if (line)
        out += (out ? '\n' : '') + line;
    return out;
}

/**
 * Check if a string value is a reserved word
 */
export function isReservedWord(ctx: SerializeContext, s: string | undefined | null): boolean {
    if (!s)
        return false;
    if (ReservedWords.includes(s.toLowerCase()))
        return true;
    for (const ext of serializers) {
        if (ext.dialect === ctx.dialect && ext.isReservedWord) {
            if (ext.isReservedWord(ctx, s))
                return true;
        }
    }
    return false;
}

export function escapeReserved(ctx: SerializeContext, s: string | undefined | null): string {
    if (!s)
        return '';
    if (isReservedWord(ctx, s))
        return '"' + s + '"';
    return s;
}
