/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

class ClauseBuilder {

  constructor(lineWidth) {
    this._lines = [];
    this.line = '';
    this.lineWidth = (lineWidth === undefined ? 80 : lineWidth || 0);
    this.indent = 0;
    this._needIndent = false;
  }

  cr() {
    this._lines.push(this.line);
    this.line = '';
    this._needIndent = true;
    return this;
  }

  crlf() {
    this._lines.push(this.line);
    this.line = '';
    this._needIndent = false;
    return this;
  }

  append(input, options) {
    if (!input) return;
    const self = this;
    const newLine = options && options.newLine;
    const spacing = !options || options.spacing === undefined ||
        options.spacing;
    if (Array.isArray(input)) {
      for (const item of input)
        self.append(item, options);
    } else {
      if (input.includes('\n')) {
        const arr = input.split('\n');
        arr.forEach((item, idx) => {
          if (idx > 0) self.cr();
          self.append(item, options);
        });
      } else {
        let space = spacing && self.line ? ' ' : '';
        if (self.line && (newLine ||
            (self.lineWidth &&
            (self.line.length + input.length > self.lineWidth)))) {
          this.cr();
          space = '';
        }
        if (self._needIndent) {
          if (!self.line)
            for (let i = 0; i < self.indent; i++)
              self.line += ' ';
          self._needIndent = false;
        }

        self.line += space + input;
      }
    }
    return self;
  }

  get lines() {
    return this._lines.length + (this.line ? 1 : 0);
  }

  toString() {
    let str = '';
    for (let i = 0; i < this._lines.length; i++) {
      str += (i > 0 ? '\n' : '') + this._lines[i];
    }
    return str + (str && this.line ? '\n' : '') + this.line;
  }

}

module.exports = ClauseBuilder;
