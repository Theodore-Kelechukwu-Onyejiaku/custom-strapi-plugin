// hooks/usePostsQuery.ts
//
// Reads the table's state straight out of the URL — Strapi's SearchInput, Filters, sortable
// headers and Pagination all write there — and forwards it to the server verbatim as
// `rawQuery`. Nothing about sorting or filtering has to be reimplemented here.

import { useCallback, useEffect, useState } from 'react';
import { useFetchClient, useQueryParams } from '@strapi/strapi/admin';

type Pagination = { page: number; pageSize: number; total: number; pageCount: number };
type PostsResponse = { posts: any[]; pagination: Pagination };

const EMPTY_PAGINATION: Pagination = { page: 1, pageSize: 10, total: 0, pageCount: 1 };

export const usePostsQuery = () => {
  const { get, del } = useFetchClient();
  const [{ rawQuery }] = useQueryParams();

  const [posts, setPosts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  // starts true so the empty state never flashes before the first fetch resolves
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await get<PostsResponse>(`/content-publisher/posts${rawQuery}`);
      setPosts(data.posts ?? []);
      setPagination(data.pagination ?? EMPTY_PAGINATION);
    } catch (error) {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [get, rawQuery]);

  // refetches whenever the URL changes, which is every sort, filter, search and page change
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (documentId: string) => {
    await del(`/content-publisher/posts/${documentId}`);
    await load();
  };

  return { posts, pagination, isLoading, refresh: load, remove };
};
