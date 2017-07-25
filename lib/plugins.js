/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

const
    items = [];

module.exports = {

  use(plugin) {
    if (typeof plugin === 'object')
      items.push(plugin);
  },

  get items() {
    return items;
  }
};

