/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

/* External module dependencies. */
const {Readable} = require('stream');
const Promisify = require('putil-promisify');
const assert = require('assert');

class RecordStream extends Readable {

  constructor(options, resultSet) {
    super(options);
    const self = this;
    options = options || {};
    self._rowNum = 0;
    self._closed = false;
    self._resultSet = resultSet;
    self._objectMode = !!(options.objectMode);
    self._objectRows = !!(options.objectRows);
    self._ignoreNulls = !!(options.ignoreNulls);
    self._limit = options.limit;
    self.metadata = options.metadata !== undefined ? options.metadata : true;
    self.mode = options.mode !== undefined ? options.mode : 0;
    resultSet.once('close', () => self.emit('close'));
  }

  get closed() {
    return this._closed || this._resultSet.closed;
  }

  set metadata(value) {
    this._metadata = !!value;
  }

  set mode(value) {
    assert(value === 0 || value === 1 || value === 'default' ||
        value === 'basic');
    this._mode = value === 1 || value === 'basic' ? 1 : 0;
  }

  /**
   * Closes stream and releases resultSet
   *
   * @param {Function} [callback]
   * @return {Promise|undefined}
   * @public
   */
  close(callback) {
    if (!callback)
      return Promisify.fromCallback((cb) => this.close(cb));
    const self = this;
    if (self._resultSet.closed) {
      if (callback)
        callback();
      return;
    }

    self.pause();
    self._resultSet.close((err) => {
      if (callback)
        callback(err);
      if (err)
        self.emit('error', err);
    });
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   * @private
   * @override
   */
  _read() {
    const self = this;

    if (self.closed) {
      self.push(null);
      return;
    }

    if (self._rowNum === 0) {
      self._rowNum++;
      let s = '';
      if (self._metadata) {
        const meta = self._objectRows ?
            self._resultSet.metaData.asObject()
            : self._resultSet.metaData.asArray();
        self.emit('metadata', meta);
        if (!self._objectMode && self._mode === 0)
          s = '"metaData":' + JSON.stringify(meta) + ', ';
      }
      if (!self._objectMode) {
        self.push(self._mode === 0 ? '{' + s + '"rows":[' : '[');
        return;
      }
    }

    let fetchCount = self._resultSet._prefetchRows;
    if (self._limit)
      fetchCount = Math.min(fetchCount, self._limit - self._rowNum + 1);

    if (self._fetchedAll || fetchCount <= 0) {
      if (!self._closed) {
        self._closed = true;
        const summary = {
          numRows: self._rowNum - 1,
          eof: !!self._resultSet.eof
        };
        self.emit('summary', summary);
        if (!self._objectMode) {
          if (self._mode === 0) {
            let s = JSON.stringify(summary);
            s = s.substring(1, s.length - 1);
            s = s ? ',' + s : '';
            self.push(']' + s + '}');
          } else self.push(']');
        }
      }
      self.push(null);
      return;
    }

    if (self._fetchedRows && self._fetchedRows.length) {
      self._pushRow(self._fetchedRows.shift());

    } else {
      self._resultSet.next({
            fetchCount,
            objectRows: self._objectRows,
            ignoreNulls: self._ignoreNulls
          },
          (err, rows) => {
            if (err)
              return self.emit('error', err);

            if (self._closed)
              return;

            self._fetchedRows = rows;
            if (!rows) {
              self._fetchedAll = true;
              self._read(); // eof reached
            } else
              self._pushRow(self._fetchedRows.shift());
          });
    }
  }

  _pushRow(row) {
    const self = this;
    self._rowNum++;
    if (self._objectMode)
      self.push(row);
    else
      self.push((self._rowNum > 2 ? ', ' : '') + JSON.stringify(row));
  }

}

module.exports = RecordStream;
