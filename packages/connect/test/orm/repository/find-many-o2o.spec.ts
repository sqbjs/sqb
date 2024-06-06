/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Eq } from '@sqb/builder';
import { SqbClient } from '@sqb/connect';
import { Customer } from '../../_support/customer.entity.js';
import { initClient } from '../../_support/init-client.js';

function toJSON(obj: any): any {
  return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
}

describe('Repository.findMany() | one to one relations', function () {
  let client: SqbClient;

  beforeAll(async () => {
    client = await initClient();
  });

  afterAll(async () => {
    await client.close(0);
  });

  describe('linkToOne', function () {
    it('return associated row as object property', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'countryCode', 'country'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(rows[0].countryCode).toStrictEqual('US');
      expect(toJSON(rows[0].country)).toStrictEqual({
        code: 'US',
        name: 'United States',
        hasMarket: true,
        phoneCode: '+1',
        continentCode: 'AM',
      });
    });

    it('dont return associated if not explicitly requested', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(rows[0].country).toBeUndefined();
    });

    it('query sub associations', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'country.continent'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(toJSON(rows[0].country)).toStrictEqual({
        continent: {
          code: 'AM',
          name: 'America',
        },
      });
    });

    it('query sub associations (include)', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id'],
        include: ['country.continent'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(toJSON(rows[0])).toStrictEqual({
        id: 1,
        country: {
          continent: {
            code: 'AM',
            name: 'America',
          },
        },
      });
    });

    it('choice which elements will be returned by server', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'country.code', 'country.continent.code'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(toJSON(rows[0].country)).toStrictEqual({
        code: 'US',
        continent: {
          code: 'AM',
        },
      });
    });

    it('filter results by associated element', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'countryCode'],
        filter: Eq('country.continent.code', 'AM'),
      });
      for (const row of rows) {
        expect(row.countryCode === 'CA' || row.countryCode === 'US').toBeTruthy();
      }
    });

    it('use "exists" when filtering by associated element', async function () {
      const repo = client.getRepository(Customer);
      let request: any = {};
      client.once('execute', req => (request = req));
      await repo.findMany({
        pick: ['id'],
        filter: [{ 'country.continent.code': 'AM' }],
      });
      expect(request.sql.includes('exists')).toBeTruthy();
      expect(request.params).toStrictEqual(['AM']);
    });

    it('order by associated element', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'countryCode', 'country.code', 'country.phoneCode'],
        sort: ['country.code'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      const left = rows.map(x => x.country!.code);
      const sorted = [...left];
      sorted.sort();
      expect(left).toStrictEqual(sorted);
    });
  });

  describe('linkFromOne', function () {
    it('return associated row as object property', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'details'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].details).toBeDefined();
      expect(rows[0].details!.customerId).toStrictEqual(1);
    });

    it('choice which elements will be returned by server', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'details.notes'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(Object.keys(rows[0].details!)).toStrictEqual(['notes']);
    });

    it('filter results by associated element', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'details'],
        filter: Eq('details.customerId', 1),
      });
      expect(rows.length).toStrictEqual(1);
      expect(rows[0].id).toStrictEqual(1);
      expect(rows[0].details!.customerId).toStrictEqual(1);
    });

    it('order by associated element', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'details.notes'],
        sort: ['details.notes'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      const left = rows.map(x => (x.details ? x.details.notes : undefined));
      const sorted = [...left];
      sorted.sort();
      expect(left).toStrictEqual(sorted);
    });
  });

  describe('Association chain', function () {
    it('return row of last association in the chain as object property', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'countryCode', 'country'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(rows[0].countryCode).toStrictEqual('US');
      expect(toJSON(rows[0].country)).toStrictEqual({
        code: 'US',
        name: 'United States',
        hasMarket: true,
        phoneCode: '+1',
        continentCode: 'AM',
      });
    });

    it('query sub associations', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'country.continent'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(toJSON(rows[0].country)).toStrictEqual({
        continent: {
          code: 'AM',
          name: 'America',
        },
      });
    });

    it('choice which elements will be returned by server', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'country.code', 'country.continent.code'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(toJSON(rows[0].country)).toStrictEqual({
        code: 'US',
        continent: {
          code: 'AM',
        },
      });
    });

    it('filter by associated element', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'countryCode'],
        filter: Eq('country.continent.code', 'AM'),
      });
      for (const row of rows) {
        expect(row.countryCode === 'CA' || row.countryCode === 'US').toBeTruthy();
      }
    });

    it('use "exists" when filtering by associated element', async function () {
      const repo = client.getRepository(Customer);
      let request: any = {};
      client.once('execute', req => (request = req));
      await repo.findMany({
        pick: ['id'],
        filter: [{ 'country.continent.code': 'AM' }],
      });
      expect(request.sql.includes('exists')).toStrictEqual(true);
      expect(request.params).toStrictEqual(['AM']);
    });

    it('order by associated element', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'countryCode', 'country.code', 'country.phoneCode'],
        sort: ['country.code'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      const left = rows.map(x => x.country!.code);
      const sorted = [...left];
      sorted.sort();
      expect(left).toStrictEqual(sorted);
    });

    it('query indirect associations', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        filter: [Eq('id', 1)],
        pick: ['id', 'continent'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].id).toStrictEqual(1);
      expect(toJSON(rows[0].continent)).toStrictEqual({
        code: 'AM',
        name: 'America',
      });
    });

    it('order by indirect associated elements', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'countryCode', 'country.continentCode'],
        sort: ['continent.code'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      const left = rows.map(x => x.country!.code);
      const sorted = [...left];
      sorted.sort();
      expect(left).toStrictEqual(sorted);
    });

    it('associations with target conditions', async function () {
      const repo = client.getRepository(Customer);
      const rows = await repo.findMany({
        pick: ['id', 'vvipDetails'],
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      const a = rows.filter(x => x.vvipDetails);
      expect(a.length).toBeGreaterThan(0);
      for (const customer of rows) {
        if (customer.vvipDetails) expect(customer.vvipDetails.rank).toBeGreaterThanOrEqual(5);
      }
    });
  });
});
