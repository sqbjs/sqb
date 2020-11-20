import {registerSerializer} from '@sqb/builder'
import {PostgresSerializer} from './PostgresSerializer';

registerSerializer(new PostgresSerializer());
