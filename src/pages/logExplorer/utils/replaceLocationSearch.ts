import queryString from 'query-string';

export default function replaceLocationSearch(params: {
  updatedQuery: { [key: string]: string | number | undefined | null }; // 更新后的查询参数
  location: Location;
  navigate: (path: any, opts?: any) => void;
  force?: boolean; // 是否强制替换当前页面记录
}) {
  const { updatedQuery, location, navigate, force } = params;
  const query = queryString.parse(location.search);

  if (force) {
    navigate({
      pathname: location.pathname,
      search: queryString.stringify(updatedQuery),
    }, { replace: true });
  } else {
    navigate({
      pathname: location.pathname,
      search: queryString.stringify({ ...query, ...updatedQuery }),
    }, { replace: true });
  }
}
