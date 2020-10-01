import {registerSerializer} from '@sqb/core'
import {OracleSerializer} from './OracleSerializer';

registerSerializer(new OracleSerializer());
