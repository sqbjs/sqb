import type {SerializationType} from './enums';
import type {SerializeContext} from './SerializeContext';

export abstract class Serializable {

    abstract _type: SerializationType;

    /**
     * Performs serialization
     */
    abstract _serialize(ctx: SerializeContext): string;

}
