import '@sqb/oracle-dialect';
import { registerAdapter } from '@sqb/connect'
import { OraAdapter } from './ora-adapter.js';

registerAdapter(new OraAdapter());
