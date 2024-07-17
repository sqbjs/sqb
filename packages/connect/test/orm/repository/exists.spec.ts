import { SqbClient } from '@sqb/connect';
import { Country } from '../../_support/country.entity.js';
import { initClient } from '../../_support/init-client.js';

describe('Repository.exists()', () => {
  let client: SqbClient;

  beforeAll(async () => {
    client = await initClient();
  });

  afterAll(async () => {
    await client.close(0);
  });

  it('should return true if any record exists by id', async () => {
    const repo = client.getRepository<Country>(Country);
    const c = await repo.exists('TR');
    expect(c).toStrictEqual(true);
  });

  it('should return true if any record exists with given filter', async () => {
    const repo = client.getRepository<Country>(Country);
    const c = await repo.exists('TR', { filter: { continentCode: 'None' } });
    expect(c).toStrictEqual(false);
  });
});
