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

class RecordStream extends Readable {

  constructor(options, resultSet) {
    super(options);
    this._rowNum = 0;
    this._closed = false;
    this._objectMode = !!(options && options.objectMode);
    this._objectRows = !!(options && options.objectRows);
    this._ignoreNulls = !!(options && options.ignoreNulls);
    if (resultSet)
      this._open(resultSet);
  }

  get closed() {
    return !this._resultSet || this._resultSet.closed;
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
    if (self.closed) {
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

  _fail(err) {
    this.emit('error', err);
  }

  _open(resultSet) {
    const self = this;
    self._resultSet = resultSet;
    self.emit('open');
    resultSet.once('close', () => self.emit('close'));
  }

  /**
   * @private
   * @override
   */
  _read() {
    const self = this;

    if (self._closed) {
      self.push(null);
      return;
    }

    /* If ResultSet is not ready yet, we add an event listener to retry after "open" called */
    if (!self._resultSet)
      return self.once('open', () => self._read());

    if (self._rowNum === 0) {
      self._rowNum++;
      if (self._objectMode) {
        const meta = self._objectRows ?
            self._resultSet.metaData.asObject()
            : self._resultSet.metaData.asArray();
        self.emit('metadata', meta);
      } else {
        const s = self._objectRows ? JSON.stringify(self._resultSet.metaData.asObject()) :
            JSON.stringify(self._resultSet.metaData.fields);
        self.push('{"metaData":' + s + ', "rows":[');
        return;
      }
    }

    if (self._resultSet.closed || self._resultSet._fetchedAll) {
      self.push(null);
      return;
    }

    if (self._fetchedRows && self._fetchedRows.length) {
      self._pushRow(self._fetchedRows.shift());
      self._rowNum++;

    } else {
      const fetchCount = self._resultSet._prefetchRows;
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
              self.push('], "numRows": ' + String(self._rowNum) + '}');
            } else {
              self._pushRow(self._fetchedRows.shift());
              self._rowNum++;
            }
          });
    }
  }

  _pushRow(row) {
    const self = this;
    if (self._objectMode)
      self.push(row);
    else
      self.push((self._rowNum > 1 ? ', ' : '') + JSON.stringify(row));
  }

}

module.exports = RecordStream;
