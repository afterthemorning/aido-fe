import {
  buildAidoExcelLogQuery,
  fallbackDaysByDate,
  getDisplayedDays,
  getSortFieldFromSorter,
  normalizeDays,
} from './explorer-utils';

describe('aido excel explorer utils', () => {
  it('builds query params with defaults and custom values', () => {
    expect(buildAidoExcelLogQuery()).toEqual({
      query_string: '',
      page: 1,
      limit: 20,
      sort_field: 'expiry_days',
      sort_order: 'asc',
    });

    expect(
      buildAidoExcelLogQuery({
        queryString: 'owner:alice',
        page: 2,
        limit: 50,
        sortField: 'next_expiry_date',
        sortOrder: 'desc',
      }),
    ).toEqual({
      query_string: 'owner:alice',
      page: 2,
      limit: 50,
      sort_field: 'next_expiry_date',
      sort_order: 'desc',
    });
  });

  it('normalizes days and avoids NaN', () => {
    expect(normalizeDays(10)).toBe(10);
    expect(normalizeDays('5')).toBe(5);
    expect(normalizeDays('abc')).toBeNull();
    expect(normalizeDays(undefined)).toBeNull();
  });

  it('falls back to next_expiry_date when expiry_days is invalid', () => {
    const maybeDays = fallbackDaysByDate('2099-01-01');
    expect(typeof maybeDays === 'number' || maybeDays === null).toBe(true);
    expect(getDisplayedDays(undefined, '2099-01-01')).toBe(maybeDays);
    expect(getDisplayedDays('bad', 'bad-date')).toBeNull();
  });

  it('only allows supported sort fields', () => {
    expect(getSortFieldFromSorter({ field: 'expiry_days' })).toBe('expiry_days');
    expect(getSortFieldFromSorter({ field: 'next_expiry_date' })).toBe('next_expiry_date');
    expect(getSortFieldFromSorter({ field: 'unknown_field' })).toBeUndefined();
  });
});
