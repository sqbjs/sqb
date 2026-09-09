import { AdapterRegistry } from '@sqb/connect';
import { SqljsAdapter } from './sqljs-adapter.js';

export * from './sqljs-adapter.js';
export * from './sqljs-connection.js';
export * from './sqljs-cursor.js';

AdapterRegistry.register(new SqljsAdapter());
