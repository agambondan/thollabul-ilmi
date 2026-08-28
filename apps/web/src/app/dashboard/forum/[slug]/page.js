import { ForumDetailContent } from "@/app/forum/[slug]/page";

export default async function DashboardForumDetailPage(props) {
    const params = await props.params;

    return (
        <div className='py-2'>
            <ForumDetailContent
                slug={params.slug}
                basePath='/dashboard/forum'
                loginNext={`/dashboard/forum/${params.slug}`}
            />
        </div>
    );
}
