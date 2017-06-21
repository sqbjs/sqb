const {Serializer} = require('../../');

class testSerializer extends Serializer {

  constructor(config) {
    super(config);
  }

}
Serializer.register('testdialect', testSerializer);

module.exports = testSerializer;
