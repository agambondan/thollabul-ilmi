import Section from "@/components/Section";
import BlogClient from "./BlogClient";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const BlogPage = async () => {
    let initialPosts = [];
    let initialCategories = [];

    try {
        const [postsRes, catRes] = await Promise.all([
            fetch(`${API_URL}/api/v1/blog/posts?page=0&size=10`, {
                cache: "no-store",
            }),
            fetch(`${API_URL}/api/v1/blog/categories`, {
                cache: "no-store",
            }),
        ]);

        if (postsRes.ok) {
            const data = await postsRes.json();
            initialPosts = data?.items ?? data ?? [];
        }
        if (catRes.ok) {
            const catData = await catRes.json();
            const items = catData?.items ?? catData?.data ?? catData ?? [];
            initialCategories = Array.isArray(items) ? items : [];
        }
    } catch {
        // Fallback gracefully to client-side empty state or fetch
    }

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <BlogClient
                    initialPosts={initialPosts}
                    initialCategories={initialCategories}
                    basePath='/blog'
                />
            </Section>
        </main>
    );
};

export default BlogPage;
