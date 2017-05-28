/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

class StringBuilder {

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

    append(input, curLine) {
        if (!input) return;
        if (Array.isArray(input)) {
            for (let i = 0; i < input.length; i++)
                this.append(input[i]);
        } else {
            if (input.indexOf('\n') >= 0) {
                const arr = input.split('\n');
                for (let i = 0; i < arr.length; i++) {
                    if (i > 0) this.cr();
                    this.append(arr[i]);
                }
            } else {
                if (!curLine && this.line && this.lineWidth && this.line.length + input.length > this.lineWidth) {
                    if (this.lines) this.cr();
                    if (input.startsWith(' '))
                        input = input.substring(1);
                }
                if (this._needIndent) {
                    for (let i = 0; i < this.indent; i++)
                        this.line += ' ';
                    this._needIndent = false;
                }
                this.line += input;
            }
        }
        return this;
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

module.exports = StringBuilder;