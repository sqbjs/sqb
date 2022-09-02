import postgresSetup from '../packages/postgres/test/_support/jest-setup.js';
import connectSetup from '../packages/connect/test/_support/jest-setup.js';

export default async function globalSetup() {
  await connectSetup();
  await postgresSetup();
}
