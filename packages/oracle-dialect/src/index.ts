import {registerSerializer} from '@sqb/builder'
import {OracleSerializer} from './OracleSerializer';

registerSerializer(new OracleSerializer());
