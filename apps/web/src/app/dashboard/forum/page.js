import { ForumListContent } from "@/app/forum/page";

export default function DashboardForumPage() {
    return (
        <div className='py-2'>
            <ForumListContent basePath='/dashboard/forum' />
        </div>
    );
}
