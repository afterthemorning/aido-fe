import { TFunction } from 'i18next';

const SUPPORTED_SORT_FIELDS = [
  'application_name',
  'environment',
  'category',
  'support_owner',
  'email',
  'next_expiry_date',
  'expiry_days',
  'disabled',
  'status',
  'record_key',
];

export interface AidoExcelLogQueryParams {
  queryString?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function buildAidoExcelLogQuery(params?: AidoExcelLogQueryParams) {
  return {
    query_string: params?.queryString || '',
    page: params?.page || 1,
    limit: params?.limit || 20,
    sort_field: params?.sortField || 'expiry_days',
    sort_order: params?.sortOrder || 'asc',
  };
}

export function normalizeDays(expiryDays: unknown): number | null {
  if (expiryDays === null || expiryDays === undefined || expiryDays === '') {
    return null;
  }
  const days = Number(expiryDays);
  if (!Number.isFinite(days)) {
    return null;
  }
  return Math.trunc(days);
}

export function fallbackDaysByDate(nextExpiryDate: unknown): number | null {
  const value = String(nextExpiryDate ?? '').trim();
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((targetStart - todayStart) / msPerDay);
}

export function getDisplayedDays(expiryDays: unknown, nextExpiryDate: unknown): number | null {
  const normalized = normalizeDays(expiryDays);
  if (normalized !== null) {
    return normalized;
  }
  return fallbackDaysByDate(nextExpiryDate);
}

export function getTagColorByDays(days: number): 'red' | 'orange' | 'green' {
  if (days < 0) {
    return 'red';
  }
  if (days <= 30) {
    return 'orange';
  }
  return 'green';
}

export function getSortFieldFromSorter(sorter: any): string | undefined {
  const rawField = sorter?.field ?? sorter?.columnKey ?? sorter?.dataIndex;
  const field = Array.isArray(rawField) ? String(rawField[rawField.length - 1] ?? '').trim() : String(rawField ?? '').trim();
  if (!field) {
    return undefined;
  }
  if (!SUPPORTED_SORT_FIELDS.includes(field)) {
    return undefined;
  }
  if (field === 'status') {
    return 'disabled';
  }
  return field;
}

export function getAidoExcelSortOrder(order: 'asc' | 'desc'): 'ascend' | 'descend' {
  return order === 'desc' ? 'descend' : 'ascend';
}

export function getKeywordFieldsLabel(t: TFunction<'explorer'>): string {
  const fields = [
    t('aido_excel.columns.application_name'),
    t('aido_excel.columns.environment'),
    t('aido_excel.columns.category'),
    t('aido_excel.columns.support_owner'),
    t('aido_excel.columns.email'),
    t('aido_excel.columns.next_expiry_date'),
    'record_key',
  ];
  return fields.join(', ');
}

export function buildExplorerRowKey(row: Record<string, any>, fallbackIndex: number): string {
  const recordKey = String(row?.record_key ?? '').trim();
  if (recordKey) {
    return recordKey;
  }

  const fingerprint = [
    row?.application_name,
    row?.environment,
    row?.category,
    row?.support_owner,
    row?.email,
    row?.next_expiry_date,
    row?.expiry_days,
    row?.disabled,
    row?.datasource_id,
  ]
    .map((v) => String(v ?? '').trim())
    .join('::');

  return `${fingerprint}::${fallbackIndex}`;
}

export function sortRowsClientSide(rows: Array<Record<string, any>>, sortField: string, sortOrder: 'asc' | 'desc') {
  const list = [...rows];
  const direction = sortOrder === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    const av = a?.[sortField];
    const bv = b?.[sortField];

    if (sortField === 'expiry_days') {
      const an = Number(av ?? Number.NEGATIVE_INFINITY);
      const bn = Number(bv ?? Number.NEGATIVE_INFINITY);
      if (an < bn) return -1 * direction;
      if (an > bn) return 1 * direction;
      return 0;
    }

    if (sortField === 'disabled') {
      const ab = String(av ?? '').toLowerCase() === 'true' || String(av ?? '') === '1';
      const bb = String(bv ?? '').toLowerCase() === 'true' || String(bv ?? '') === '1';
      if (ab === bb) return 0;
      return (ab ? 1 : -1) * direction;
    }

    const as = String(av ?? '');
    const bs = String(bv ?? '');
    return as.localeCompare(bs) * direction;
  });

  return list;
}
