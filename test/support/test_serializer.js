function TestSerializer(config) {
  this.dialect = config.dialect;
  this.paramType = 0;
}

TestSerializer.prototype.isReserved = function(s) {
  return false;
};

TestSerializer.prototype.serializeSelect = function(instance, obj, inf) {
  return instance.serializeSelect(obj, inf);
};

TestSerializer.prototype.serializeFrom = function(instance, tables, inf) {
  return instance.serializeFrom(tables, inf);
};

TestSerializer.prototype.serializeReturning =
    function(instance, bindings, inf) {
      return instance.serializeReturning(bindings, inf);
    };

module.exports = {
  createSerializer: function(config) {
    if (config.dialect === 'test') {
      return new TestSerializer(config);
    }
  }
};
