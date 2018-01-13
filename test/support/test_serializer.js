function TestSerializer(config) {
  this.dialect = config.dialect;
  this.paramType = 0;
}

TestSerializer.prototype.serialize = function(ctx, type, o, defFn) {
  return defFn.apply(null, arguments);
};

TestSerializer.prototype.isReserved = function(ctx, s) {
  return false;
};

module.exports = {
  createSerializer: function(config) {
    if (config.dialect === 'test') {
      return new TestSerializer(config);
    }
  }
};
