import { registerSerializer } from '@sqb/builder'
import { OracleSerializer } from './oracle-serializer.js';

registerSerializer(new OracleSerializer());
