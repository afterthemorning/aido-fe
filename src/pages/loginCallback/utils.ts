const basePrefix = import.meta.env.VITE_PREFIX || '';

export const getDefaultRedirect = () => `${basePrefix || ''}/`;

export const normalizeRedirect = (redirect?: string) => {
  if (!redirect) {
    return getDefaultRedirect();
  }

  if (/^https?:\/\//i.test(redirect)) {
    return redirect;
  }

  if (!basePrefix) {
    return redirect;
  }

  if (redirect === basePrefix || redirect.startsWith(`${basePrefix}/`)) {
    return redirect;
  }

  if (redirect.startsWith('/')) {
    return `${basePrefix}${redirect}`;
  }

  return redirect;
};

export const loginPath = `${basePrefix || ''}/login`;