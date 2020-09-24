import {EventEmitter} from 'events';
import {Adapter, ConnectionOptions} from './interfaces';

export class Connection extends EventEmitter {
  private adapter: Adapter;

  constructor(opts: ConnectionOptions) {
      super();
      this.adapter = {};
  }

}
