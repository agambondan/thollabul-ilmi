jest.mock("../api/client", () => ({
    requestJson: jest.fn(),
    postJson: jest.fn(),
    pickItems: jest.fn((payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.data?.items)) return payload.data.items;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    }),
}));

const { requestJson, postJson } = require("../api/client");
const {
    normalizeFeedPost,
    normalizeComment,
    getFeedPosts,
    getFeedPostPage,
    likeFeedPost,
    getCommentsByRef,
    createComment,
} = require("../api/social");

describe("social api", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("normalizeFeedPost", () => {
        test("normalizes feed post with author name", () => {
            const result = normalizeFeedPost({
                id: 1,
                author: { name: "Ali" },
                caption: "Baca ini",
                likes: 5,
                ref_type: "ayah",
                ref_id: "1",
            });
            expect(result.id).toBe(1);
            expect(result.title).toBe("Ali");
            expect(result.body).toBe("Baca ini");
            expect(result.meta).toContain("Ayat 1");
            expect(result.meta).toContain("5 suka");
        });

        test("normalizes feed post without caption", () => {
            const result = normalizeFeedPost(
                {
                    author: { username: "user1" },
                    ref_type: "hadith",
                    ref_id: "10",
                },
                2,
            );
            expect(result.title).toBe("user1");
            expect(result.body).toBe(
                "Membagikan rujukan untuk dibaca bersama.",
            );
            expect(result.meta).toContain("Hadis 10");
        });

        test("handles missing author", () => {
            const result = normalizeFeedPost({}, 0);
            expect(result.title).toBe("Pengguna");
        });

        test("stringifies likes as number", () => {
            const result = normalizeFeedPost({
                author: { name: "A" },
                likes: "3",
            });
            expect(result.meta).toContain("3 suka");
        });
    });

    describe("normalizeComment", () => {
        test("normalizes comment with username", () => {
            const result = normalizeComment({
                id: 1,
                username: "user1",
                content: "Bagus!",
            });
            expect(result.id).toBe(1);
            expect(result.author).toBe("user1");
            expect(result.content).toBe("Bagus!");
        });

        test("normalizes comment with author object", () => {
            const result = normalizeComment({
                author: { name: "Ali" },
                content: "Setuju",
            });
            expect(result.author).toBe("Ali");
        });

        test("handles nested data", () => {
            const result = normalizeComment({
                data: { id: 5, username: "budi", content: "test" },
            });
            expect(result.id).toBe(5);
            expect(result.author).toBe("budi");
        });

        test("falls back for empty input", () => {
            const result = normalizeComment({}, 3);
            expect(result.id).toBe("comment-3");
            expect(result.author).toBe("Pengguna");
            expect(result.content).toBe("");
        });
    });

    describe("getFeedPosts", () => {
        test("calls correct endpoint and normalizes", async () => {
            requestJson.mockResolvedValueOnce({
                items: [
                    {
                        id: 1,
                        author: { name: "Ali" },
                        caption: "Post 1",
                        likes: 2,
                    },
                ],
            });
            const result = await getFeedPosts({ page: 0, size: 20 });
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/feed?page=0&size=20",
            );
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Ali");
        });

        test("appends refType when provided", async () => {
            requestJson.mockResolvedValueOnce({ items: [] });
            await getFeedPosts({ refType: "ayah" });
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/feed?page=0&size=20&ref_type=ayah",
            );
        });

        test("uses defaults when no options given", async () => {
            requestJson.mockResolvedValueOnce({ items: [] });
            await getFeedPosts();
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/feed?page=0&size=20",
            );
        });
    });

    describe("getFeedPostPage", () => {
        test("calls endpoint and returns paginated result", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ id: 1, author: { name: "A" } }],
                last: false,
                page: 0,
                size: 20,
            });
            const result = await getFeedPostPage({ page: 0, size: 20 });
            expect(result.items).toHaveLength(1);
            expect(result.meta.hasMore).toBe(true);
        });

        test("marks hasMore false when last is true", async () => {
            requestJson.mockResolvedValueOnce({
                items: [],
                last: true,
                page: 0,
                size: 20,
            });
            const result = await getFeedPostPage({ page: 0, size: 20 });
            expect(result.meta.hasMore).toBe(false);
        });
    });

    describe("likeFeedPost", () => {
        test("calls postJson and normalizes", async () => {
            postJson.mockResolvedValueOnce({
                id: 5,
                author: { name: "Budi" },
                likes: 10,
            });
            const result = await likeFeedPost(5);
            expect(postJson).toHaveBeenCalledWith(
                "/api/v1/feed/5/like",
                {},
                { auth: true },
            );
            expect(result.id).toBe(5);
            expect(result.title).toBe("Budi");
        });
    });

    describe("getCommentsByRef", () => {
        test("calls correct endpoint", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ id: 1, username: "u1", content: "komen" }],
            });
            const result = await getCommentsByRef({
                refType: "ayah",
                refId: "1",
            });
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/comments?ref_id=1&ref_type=ayah",
            );
            expect(result).toHaveLength(1);
            expect(result[0].author).toBe("u1");
        });

        test("returns empty array when refType or refId missing", async () => {
            const result = await getCommentsByRef({ refType: "", refId: "" });
            expect(requestJson).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe("createComment", () => {
        test("calls postJson with correct body", async () => {
            postJson.mockResolvedValueOnce({
                id: 10,
                username: "user1",
                content: "Bagus!",
            });
            const result = await createComment({
                content: "Bagus!",
                refId: "1",
                refType: "ayah",
            });
            expect(postJson).toHaveBeenCalledWith(
                "/api/v1/comments",
                {
                    content: "Bagus!",
                    parent_id: undefined,
                    ref_id: 1,
                    ref_type: "ayah",
                },
                { auth: true },
            );
            expect(result.id).toBe(10);
            expect(result.content).toBe("Bagus!");
        });

        test("includes parentId when provided", async () => {
            postJson.mockResolvedValueOnce({
                id: 11,
                username: "u2",
                content: "reply",
            });
            await createComment({
                content: "reply",
                parentId: 5,
                refId: "1",
                refType: "ayah",
            });
            expect(postJson).toHaveBeenCalledWith(
                "/api/v1/comments",
                expect.objectContaining({ parent_id: 5 }),
                { auth: true },
            );
        });
    });
});
