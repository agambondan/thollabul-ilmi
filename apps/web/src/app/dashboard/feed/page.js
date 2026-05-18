import { FeedContent } from '@/app/feed/page';

export default function DashboardFeedPage() {
    return (
        <div className='py-2'>
            <FeedContent basePath='/dashboard/feed' />
        </div>
    );
}
