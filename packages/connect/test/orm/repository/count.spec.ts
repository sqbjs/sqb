import { SqbClient } from '@sqb/connect';
import { Country } from '../../_support/country.entity.js';
import { initClient } from '../../_support/init-client.js';

describe('Repository.count()', function () {
  let client: SqbClient;

  beforeAll(async () => {
    client = await initClient();
  });

  afterAll(async () => {
    await client.close(0);
  });

  it('should return number of rows', async function () {
    const repo = client.getRepository<Country>(Country);
    const c = await repo.count();
    expect(c).toBeGreaterThan(0);
  });

  it('should return number of filtered rows', async function () {
    const repo = client.getRepository<Country>(Country);
    const c = await repo.count();
    const c2 = await repo.count({ filter: { continentCode: 'AM' } });
    expect(c).toBeGreaterThan(0);
    expect(c2).toBeGreaterThan(0);
    expect(c).toBeGreaterThan(c2);
  });

  it('should filter by one-2-one relation element', async function () {
    const repo = client.getRepository<Country>(Country);
    const c = await repo.count();
    const c2 = await repo.count({ filter: { 'continent.code': 'AM' } });
    expect(c).toStrictEqual(4);
    expect(c2).toStrictEqual(2);
  });

  it('should filter by one-2-many relation element', async function () {
    const repo = client.getRepository<Country>(Country);
    const c2 = await repo.count({ filter: { 'customers.countryCode': 'DE' } });
    expect(c2).toStrictEqual(1);
  });
});
