import '@sqb/oracle-dialect';
import {registerAdapter} from '@sqb/connect'
import {OraAdapter} from './OraAdapter';

registerAdapter(new OraAdapter());
