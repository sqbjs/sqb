import {registerSerializer} from '@sqb/builder'
import {SqliteSerializer} from './SqliteSerializer';

registerSerializer(new SqliteSerializer());
