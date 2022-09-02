import {registerSerializer} from '@sqb/builder'
import {SqliteSerializer} from './sqlite-serializer.js';

registerSerializer(new SqliteSerializer());
