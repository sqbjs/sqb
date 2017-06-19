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
    const self = this;
    self._rowNum = 0;
    self._closed = false;
    self._objectMode = !!(options && options.objectMode);
    self._objectRows = !!(options && options.objectRows);
    self._ignoreNulls = !!(options && options.ignoreNulls);
    self._limit = options ? options.limit : undefined;
    self._resultSet = resultSet;
    resultSet.once('close', () => self.emit('close'));
  }

  get closed() {
    return this._closed || this._resultSet.closed;
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
      const meta = self._objectRows ?
          self._resultSet.metaData.asObject()
          : self._resultSet.metaData.asArray();
      self.emit('metadata', meta);
      if (!self._objectMode) {
        const s = JSON.stringify(meta);
        self.push('{"metaData":' + s + ', "rows":[');
        return;
      }
    }

    //console.log('_read2');
    let fetchCount = self._resultSet._prefetchRows;
    if (self._limit)
      fetchCount = Math.min(fetchCount, self._limit - self._rowNum + 1);

    if (self._resultSet.eof || fetchCount <= 0) {
      if (!self._closed) {
        self._closed = true;
        const summary = {
          numRows: self._rowNum,
          eof: !(self._resultSet && !self._resultSet.eof)
        };
        self.emit('summary', summary);
        if (!self._objectMode) {
          let s = JSON.stringify(summary);
          s = s.substring(1, s.length - 1);
          s = s ? ',' + s : '';
          self.push(']' + s + '}');
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
            if (!rows)
              self._read(); // eof reached
            else
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
      self.push((self._rowNum > 1 ? ', ' : '') + JSON.stringify(row));
  }

}

module.exports = RecordStream;
