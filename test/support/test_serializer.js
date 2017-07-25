
class TestSerializer {

  constructor(config) {
    this.dialect = config.dialect;
  }

}

module.exports = {
  createSerializer(config) {
    if (config.dialect === 'test') {
      return new TestSerializer(config);
    }
  }
};
