import {registerAdapter} from '@sqb/connect'
import {OraAdapter} from './OraAdapter';
import '@sqb/oracle-dialect';

registerAdapter(new OraAdapter());
