const postgresSetup = require('../packages/postgres/test/_support/jest-setup.cjs');
const connectSetup = require('../packages/connect/test/_support/jest-setup.cjs');

module.exports = async function globalSetup() {
  await connectSetup();
  await postgresSetup();
};
