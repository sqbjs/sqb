import {registerAdapter} from '@sqb/connect'
import {PgAdapter} from './PgAdapter';

// eslint-disable-next-line no-console
console.log(PgAdapter);

registerAdapter(new PgAdapter());
