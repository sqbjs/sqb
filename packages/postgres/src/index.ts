import '@sqb/postgres-dialect';
import {registerAdapter} from '@sqb/connect'
import {PgAdapter} from './pg-adapter.js';

registerAdapter(new PgAdapter());
