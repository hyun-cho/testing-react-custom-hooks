import usePage, { DEFAULT_PAGE, Page } from '@common/components/test/usePage';
import { Store } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';
import { usePageDetail } from '@wiki/hooks/usePageDetail';

import { State } from 'history';
import { Provider as ReduxProvider } from 'react-redux';

const pageId1 = '1';
const pageId2 = '2';

const setupRenderCustomHook = (pageId: string, defaultPage?: Page) => {
  return renderHook(({ pageId }) => usePage(pageId, defaultPage), {
    initialProps: {
      pageId,
    },
  });
};

const setupRenderCustomHookWithWrapper = (
  state: any,
  pageId: string,
  defaultPage?: Page,
) => {
  const store = {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => () => null,
  } as unknown as Store;

  return renderHook(({ pageId }) => usePage(pageId, defaultPage), {
    initialProps: {
      pageId,
    },
    wrapper: ({ children }) => (
      <ReduxProvider store={store}>{children}</ReduxProvider>
    ),
  });
};

const fetchMock = (url: string, suffix = '') => {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({
        json: () =>
          Promise.resolve({
            data: {
              name: url,
              creator: url + suffix,
            } as Page,
          }),
      });
    }, 50 + Math.random() * 150),
  );
};

describe('usePage', () => {
  // runs before any tests start running
  beforeAll(() => {
    global.fetch = jest.fn(fetchMock) as jest.Mock;
  });

  it('usePage를 새로운 pageId와 호출하면 isLoading은 true이다.', () => {
    const { result } = setupRenderCustomHook(pageId1);

    const [, isLoading] = result.current;

    expect(isLoading).toBe(true);
  });

  it('usePage에 pageId이 전달되면 캐시에 존재하지 않기 때문에 isLoading은 true로 data는 DEFAULT_PAGE로 초기화된다.', () => {
    const { result } = setupRenderCustomHook(pageId1);

    const [defaultPage, isLoading] = result.current;

    expect(defaultPage).toBe(DEFAULT_PAGE);
    expect(isLoading).toBe(true);
  });

  it('비동기 fetch 요청 지연 이후에 data를 새로운 페이지 데이터 page1으로 업데이트하고 isLoading은 false가 된다.', async () => {
    const { result, waitForNextUpdate } = setupRenderCustomHook(pageId1);

    expect(global.fetch).toHaveBeenCalledWith(`/get-page/${pageId1}`);

    await waitForNextUpdate();

    const [page1, isLoading] = result.current;

    expect(isLoading).toBe(false);
    expect(page1).toEqual({
      name: `/get-page/${pageId1}`,
      creator: `/get-page/${pageId1}`,
    });
  });

  it('usePage호출 이후에 캐시되지 않은 pageId가 전달되면 isLoading은 true로, data는 DEFAULT_PAGE로 초기화된다.', async () => {
    const { result, waitForNextUpdate, rerender } =
      setupRenderCustomHook(pageId1);

    await waitForNextUpdate();

    rerender({ pageId: pageId2 });

    const [defaultPage, isLoading] = result.current;

    expect(isLoading).toBe(true);
    expect(defaultPage).toBe(DEFAULT_PAGE);
  });

  it('usePage호출 이후에 캐시되지 않은 pageId가 전달되고 비동기 fetch 요청 지연 이후에 isLoading은 false로, data는 page2로 초기화된다.', async () => {
    const { result, waitForNextUpdate, rerender } =
      setupRenderCustomHook(pageId1);

    await waitForNextUpdate();

    rerender({ pageId: pageId2 });

    await waitForNextUpdate();

    const [page2, isLoading] = result.current;

    expect(isLoading).toBe(false);
    expect(page2).toEqual({
      name: `/get-page/${pageId2}`,
      creator: `/get-page/${pageId2}`,
    });
  });

  it('usePage에 캐시된 pageId가 전달되면 isLoading은 false로, data는 캐시된 page로 초기화된다.', async () => {
    const { result, waitForNextUpdate, rerender } =
      setupRenderCustomHook(pageId1);

    await waitForNextUpdate();

    rerender({ pageId: pageId2 });

    await waitForNextUpdate();

    rerender({ pageId: pageId1 });

    const [page1, isLoading] = result.current;

    expect(isLoading).toBe(false);
    expect(page1).toEqual({
      name: `/get-page/${pageId1}`,
      creator: `/get-page/${pageId1}`,
    });
  });

  it('캐시된 데이터도 비동기 fetch 요청 지연 이후에 data를 새로운 페이지 데이터로 업데이트한다.', async () => {
    const { result, waitForNextUpdate, rerender } =
      setupRenderCustomHook(pageId1);

    await waitForNextUpdate();

    rerender({ pageId: pageId2 });

    await waitForNextUpdate();

    rerender({ pageId: pageId1 });

    const [page1] = result.current;

    await waitForNextUpdate();

    const [newPage1] = result.current;

    expect(page1).not.toBe(newPage1);
  });
});
