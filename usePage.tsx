import { useEffect, useState } from 'react';

export interface Page {
  name: string;
  creator?: string;
}
type PageMap = { [id in string]?: Page };
const CachePageMap: PageMap = {};
export const DEFAULT_PAGE: Page = { name: '', creator: '' };

const usePage = (pageId: string, defaultPage = DEFAULT_PAGE) => {
  const [data, setData] = useState<Page>(defaultPage);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // cacheID는 캐시된 값을 찾아오기 위한 유일한 값이다.
    const cacheID = pageId;
    // 먼저 캐시가 존재하는지 확인하고 만약 존재한다면 값을 설정한다.
    const cachePage = CachePageMap[cacheID];
    if (cachePage !== undefined) {
      setData(cachePage);
      setLoading(false);
    } else {
      // 캐시가 존재하지 않는다면 로딩 상태를 true로 만들어야 한다.
      setLoading(true);
      setData(defaultPage);
    }

    // 새로운 데이터를 fetch한다.
    const url = `/get-page/${pageId}`;
    fetch(url)
      .then((res) => res.json())
      .then((newData) => {
        CachePageMap[cacheID] = newData.data;
        setData(newData.data);
        setLoading(false);
      });
  }, [defaultPage, pageId]);

  return [data, isLoading];
};

export default usePage;
