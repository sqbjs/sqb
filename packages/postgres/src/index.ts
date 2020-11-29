import {registerAdapter} from '@sqb/connect'
import {PgAdapter} from './PgAdapter';
import '@sqb/postgres-dialect';

registerAdapter(new PgAdapter());
