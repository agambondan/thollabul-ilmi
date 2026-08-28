import {
    pickItems,
    requestJson,
    postJson,
    putJson,
    deleteJson,
} from "./client";

export const normalizeForumQuestion = (item) => {
    const user = item?.user ?? {};
    return {
        id: item?.id ?? "",
        title: item?.title ?? "",
        body: item?.body ?? "",
        slug: item?.slug ?? "",
        tags: item?.tags
            ? item.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
            : [],
        viewCount: item?.view_count ?? 0,
        answerCount: item?.answer_count ?? 0,
        voteCount: item?.vote_count ?? 0,
        isAnswered: !!item?.is_answered,
        createdAt: item?.created_at ?? "",
        user: { name: user?.name ?? user?.email ?? "Pengguna" },
        raw: item,
    };
};

export const normalizeForumAnswer = (item) => {
    const user = item?.user ?? {};
    return {
        id: item?.id ?? "",
        body: item?.body ?? "",
        voteCount: item?.vote_count ?? 0,
        isAccepted: !!item?.is_accepted,
        createdAt: item?.created_at ?? "",
        user: { name: user?.name ?? user?.email ?? "Pengguna" },
        raw: item,
    };
};

export const getForumQuestions = async ({
    page = 0,
    size = 20,
    q = "",
} = {}) => {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });
    if (q) params.set("q", q);
    const payload = await requestJson(
        `/api/v1/forum/questions?${params.toString()}`,
    );
    const items = pickItems(payload).map(normalizeForumQuestion);
    const total = payload?.total ?? items.length;
    return {
        items,
        total,
        hasMore: page * size + items.length < total,
    };
};

export const getForumQuestion = async (slug) => {
    const payload = await requestJson(`/api/v1/forum/questions/${slug}`);
    const item = payload?.data ?? payload;
    return {
        question: normalizeForumQuestion(item),
        answers: (item?.answers ?? []).map(normalizeForumAnswer),
    };
};

export const createForumQuestion = async ({ title, body, tags }) => {
    const payload = await postJson(
        "/api/v1/forum/questions",
        { title, body, tags },
        { auth: true },
    );
    return payload?.data ?? payload;
};

export const deleteForumQuestion = async (id) => {
    await deleteJson(`/api/v1/forum/questions/${id}`, { auth: true });
};

export const createForumAnswer = async (questionId, { body }) => {
    const payload = await postJson(
        `/api/v1/forum/questions/${questionId}/answers`,
        { body },
        { auth: true },
    );
    return payload?.data ?? payload;
};

export const acceptForumAnswer = async (questionId, answerId) => {
    await putJson(
        `/api/v1/forum/questions/${questionId}/answers/${answerId}/accept`,
        {},
        { auth: true },
    );
};

export const deleteForumAnswer = async (id) => {
    await deleteJson(`/api/v1/forum/answers/${id}`, { auth: true });
};

export const voteForum = async ({ targetType, targetId, value }) => {
    const payload = await postJson(
        "/api/v1/forum/votes",
        { target_type: targetType, target_id: targetId, value },
        { auth: true },
    );
    return payload?.data ?? payload;
};
