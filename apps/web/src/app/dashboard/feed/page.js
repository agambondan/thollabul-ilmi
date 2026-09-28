import { FeedContent } from "@/app/feed/FeedPageClient";

export default function DashboardFeedPage() {
    return (
        <div className='py-2'>
            <FeedContent basePath='/dashboard/feed' />
        </div>
    );
}
