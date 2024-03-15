import { registerSerializer } from '@sqb/builder'
import { MSSqlSerializer } from './ms-sql-serializer.js';

registerSerializer(new MSSqlSerializer());
