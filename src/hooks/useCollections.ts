/**
 * 찜·장바구니·기록 훅(로컬 우선) — 모듈 캐시 + 구독으로 전 화면 동기화.
 * 서버 동기화(로그인 시)는 api 계층에서 추가된다 — UI는 이 훅만 바라본다.
 */
import { useCallback, useEffect, useState } from 'react';

import {
  addLocalRecord,
  addToLocalCart,
  getLocalCart,
  getLocalRecords,
  getLocalWishlist,
  removeFromLocalCart,
  removeLocalRecord,
  toggleLocalWishlist,
  type CartItem,
  type LocalRecord,
} from '@/state/localCollections';

type Store<T> = { value: T | undefined; listeners: Set<() => void> };

function makeStore<T>(): Store<T> {
  return { value: undefined, listeners: new Set() };
}

const wishlistStore = makeStore<string[]>();
const cartStore = makeStore<CartItem[]>();
const recordsStore = makeStore<LocalRecord[]>();

function useStore<T>(store: Store<T>, load: () => Promise<T>): [T | undefined, (v: T) => void] {
  const [, bump] = useState(0);

  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (alive) bump((b) => b + 1);
    };
    store.listeners.add(sync);
    if (store.value === undefined) {
      load().then((v) => {
        store.value = v;
        for (const l of store.listeners) l();
      });
    }
    return () => {
      alive = false;
      store.listeners.delete(sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback(
    (v: T) => {
      store.value = v;
      for (const l of store.listeners) l();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return [store.value, set];
}

export function useWishlist() {
  const [ids, set] = useStore(wishlistStore, getLocalWishlist);
  const toggle = useCallback(
    async (activityId: string) => {
      set(await toggleLocalWishlist(activityId));
    },
    [set],
  );
  return { ids: ids ?? [], loading: ids === undefined, isWished: (id: string) => (ids ?? []).includes(id), toggle };
}

export function useCart() {
  const [items, set] = useStore(cartStore, getLocalCart);
  const add = useCallback(async (activityId: string) => set(await addToLocalCart(activityId)), [set]);
  const remove = useCallback(async (activityId: string) => set(await removeFromLocalCart(activityId)), [set]);
  return { items: items ?? [], loading: items === undefined, count: (items ?? []).length, add, remove };
}

export function useRecords() {
  const [records, set] = useStore(recordsStore, getLocalRecords);
  const add = useCallback(
    async (r: Omit<LocalRecord, 'id' | 'createdAt'>) => set(await addLocalRecord(r)),
    [set],
  );
  const remove = useCallback(async (id: string) => set(await removeLocalRecord(id)), [set]);
  return { records: records ?? [], loading: records === undefined, add, remove };
}
