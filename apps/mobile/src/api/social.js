import { pickItems, postJson, requestJson } from './client';

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim()) ?? '';

const unwrapData = (payload) => payload?.data ?? payload;

const refLabel = (refType, refId) => {
  if (refType === 'ayah') return `Ayat ${refId}`;
  if (refType === 'hadith') return `Hadis ${refId}`;
  return `Rujukan ${refId}`;
};

export const normalizeFeedPost = (payload, index = 0) => {
  const item = unwrapData(payload);
  const author = item?.author ?? {};
  const authorName = pickText(author.name, author.username, author.email, 'Pengguna');
  const likes = Number(item?.likes ?? 0);
  const refType = item?.ref_type ?? 'ref';
  const refId = item?.ref_id ?? item?.id ?? index + 1;

  return {
    id: item?.id ?? `feed-${index}`,
    title: authorName,
    body: pickText(item?.caption, 'Membagikan rujukan untuk dibaca bersama.'),
    meta: `${refLabel(refType, refId)} · ${likes} suka`,
    raw: item,
  };
};

export const normalizeComment = (payload, index = 0) => {
  const item = unwrapData(payload);
  return {
    id: item?.id ?? `comment-${index}`,
    author: pickText(item?.username, item?.author?.name, item?.author?.email, 'Pengguna'),
    content: pickText(item?.content),
    raw: item,
  };
};

export const getFeedPosts = async ({ page = 0, size = 20, refType = '' } = {}) => {
  const params = new URLSearchParams({ page: `${page}`, size: `${size}` });
  if (refType) params.set('ref_type', refType);
  const payload = await requestJson(`/api/v1/feed?${params.toString()}`);
  return pickItems(payload).map(normalizeFeedPost);
};

export const getFeedPostPage = async ({ page = 0, size = 20, refType = '' } = {}) => {
  const params = new URLSearchParams({ page: `${page}`, size: `${size}` });
  if (refType) params.set('ref_type', refType);
  const payload = await requestJson(`/api/v1/feed?${params.toString()}`);
  const items = pickItems(payload).map(normalizeFeedPost);
  return {
    items,
    meta: {
      hasMore: typeof payload?.last === 'boolean' ? !payload.last : items.length >= size,
      limit: Number(payload?.size ?? size),
      offset: Number(payload?.page ?? page) * Number(payload?.size ?? size),
    },
  };
};

export const likeFeedPost = async (id) => {
  const payload = await postJson(`/api/v1/feed/${id}/like`, {}, { auth: true });
  return normalizeFeedPost(payload);
};

export const hideFeedPost = async (id) => {
  await postJson(`/api/v1/feed/${id}/hide`, {}, { auth: true });
};

export const reportFeedPost = async (id) => {
  await postJson(`/api/v1/feed/${id}/report`, {}, { auth: true });
};

export const getCommentsByRef = async ({ refType, refId }) => {
  if (!refType || !refId) return [];
  const params = new URLSearchParams({ ref_id: `${refId}`, ref_type: refType });
  const payload = await requestJson(`/api/v1/comments?${params.toString()}`);
  return pickItems(payload).map(normalizeComment);
};

export const createComment = async ({ content, parentId, refId, refType }) => {
  const payload = await postJson(
    '/api/v1/comments',
    {
      content,
      parent_id: parentId ?? undefined,
      ref_id: Number(refId),
      ref_type: refType,
    },
    { auth: true },
  );
  return normalizeComment(payload);
};
