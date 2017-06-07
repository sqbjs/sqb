/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

function paragraphOut(input, options) {
  options = options || {};
  options.indent = options.indent || 2;
  let out = '';
  let indent = 0;

  const fillChar = function(cnt, chr = ' ') {
    let str = '';
    for (let i = 0; i < cnt; i++)
      str += chr;
    return str;
  };
  let newline = 0;
  let pchr = 0;
  input = String(input);

  for (let i = 0; i < input.length; i++) {
    let chr = input.charAt(i);
    let k = 0;
    while (options.singleLine && ['\t', '\n', '\r', '\b'].includes(chr)) {
      if (chr === '\b')
        indent -= options.indent;
      else
        k++;
      i++;
      chr = input.charAt(i);
    }
    if (k && !['('].includes(pchr) && ![')'].includes(chr))
      out += ' ';

    switch (chr) {
      case '\t':
        if (newline)
          indent += options.indent;
        else
          out += fillChar(options.indent);
        break;
      case '\b':
        indent -= options.indent;
        break;
      case '\n':
        out += '\n';
        newline = true;
        break;
      case '\r':
        out += '\n';
        newline = true;
        indent = 0;
        break;
      default : {
        if (newline) {
          out += fillChar(indent);
          newline = false;
        }
        out += chr;
      }
    }
    pchr = chr;
  }
  return out;
}

module.exports = paragraphOut;
