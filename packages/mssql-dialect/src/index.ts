import {registerSerializer} from '@sqb/builder'
import {MSSqlSerializer} from './MSSqlSerializer';

registerSerializer(new MSSqlSerializer());
