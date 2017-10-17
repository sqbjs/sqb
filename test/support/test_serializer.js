function TestSerializer(config) {
  this.dialect = config.dialect;
}

const proto = TestSerializer.prototype = {};
proto.constructor = TestSerializer;

module.exports = {
  createSerializer: function(config) {
    if (config.dialect === 'test') {
      return new TestSerializer(config);
    }
  }
};
