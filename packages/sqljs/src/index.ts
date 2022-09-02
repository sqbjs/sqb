import {registerAdapter} from '@sqb/connect';
import {SqljsAdapter} from './sqljs-adapter.js';

registerAdapter(new SqljsAdapter());
