import {registerAdapter} from '@sqb/connect'
import {OraAdapter} from './OraAdapter';

// eslint-disable-next-line no-console
console.log(OraAdapter);

registerAdapter(new OraAdapter());
