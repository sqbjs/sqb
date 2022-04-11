import '@sqb/postgres-dialect';
import {registerAdapter} from '@sqb/connect'
import {PgAdapter} from './PgAdapter';

registerAdapter(new PgAdapter());
