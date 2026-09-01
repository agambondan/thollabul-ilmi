import { PanduanSholatContent } from "./PanduanSholatClient";

export default function PanduanSholatPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <PanduanSholatContent />
            </div>
        </main>
    );
}
