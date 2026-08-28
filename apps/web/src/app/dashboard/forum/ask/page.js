import { ForumAskContent } from "@/app/forum/ask/page";

export default function DashboardForumAskPage() {
    return (
        <div className='py-2'>
            <ForumAskContent
                basePath='/dashboard/forum'
                loginNext='/dashboard/forum/ask'
            />
        </div>
    );
}
