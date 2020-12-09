import {registerAdapter} from '@sqb/connect'
import {SqljsAdapter} from './SqljsAdapter';

registerAdapter(new SqljsAdapter());
