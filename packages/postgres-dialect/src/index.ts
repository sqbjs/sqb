import { registerSerializer } from '@sqb/builder';
import { PostgresSerializer } from './postgres-serializer.js';

registerSerializer(new PostgresSerializer());
