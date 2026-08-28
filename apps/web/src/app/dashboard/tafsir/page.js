import { TafsirIndexContent } from "@/app/tafsir/page";

export default function DashboardTafsirPage() {
    return (
        <div className='py-2'>
            <TafsirIndexContent tafsirBasePath='/dashboard/tafsir' />
        </div>
    );
}
