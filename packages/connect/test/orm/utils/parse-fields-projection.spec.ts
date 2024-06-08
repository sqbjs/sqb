import 'reflect-metadata';
import { parseFieldsProjection } from '../../../src/index.js';

describe('parseFieldsProjection()', function () {
  afterAll(() => global.gc && global.gc());

  it('Should parse comma seperated field names', async () => {
    const out = parseFieldsProjection('a,b,c');
    expect(out).toStrictEqual({
      a: {},
      b: {},
      c: {},
    });
  });

  it('Should parse array of field names', async () => {
    const out = parseFieldsProjection(['a', 'b', 'c,d']);
    expect(out).toStrictEqual({
      a: {},
      b: {},
      c: {},
      d: {},
    });
  });

  it('Should parse array of fields paths', async () => {
    const out = parseFieldsProjection(['a', 'b.a', 'b.b.a', 'b.b.b']);
    expect(out).toStrictEqual({
      a: {},
      b: {
        projection: {
          a: {},
          b: {
            projection: {
              a: {},
              b: {},
            },
          },
        },
      },
    });
  });

  it('Should ignore sub paths if whole path required', async () => {
    const out = parseFieldsProjection(['a.a', 'a.b', 'a', 'b.b.a', 'b.b']);
    expect(out).toStrictEqual({
      a: {},
      b: {
        projection: {
          b: {},
        },
      },
    });
  });

  it('Should parse signs', async () => {
    const out = parseFieldsProjection(['+a', '-b']);
    expect(out).toStrictEqual({
      a: { sign: '+' },
      b: { sign: '-' },
    });
  });

  it('Should parse signs of sub fields', async () => {
    const out = parseFieldsProjection(['a', 'b.+a', 'b.+b.-a']);
    expect(out).toStrictEqual({
      a: {},
      b: {
        projection: {
          a: { sign: '+' },
          b: {
            sign: '+',
            projection: {
              a: { sign: '-' },
            },
          },
        },
      },
    });
  });

  it('Should parse parentheses', async () => {
    const out = parseFieldsProjection(['a(+b,-c(+a,b))']);
    expect(out).toStrictEqual({
      a: {
        projection: {
          b: { sign: '+' },
          c: {
            sign: '-',
            projection: {
              a: { sign: '+' },
              b: {},
            },
          },
        },
      },
    });
  });
});
