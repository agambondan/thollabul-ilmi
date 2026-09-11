"use client";

import { useState } from "react";
import ContentReportModal from "@/components/ContentReportModal";
import { BsExclamationTriangleFill } from "react-icons/bs";

export default function SirohReportButton({
    targetId,
    targetTitle,
    snippet,
    label,
}) {
    const [reportOpen, setReportOpen] = useState(false);

    return (
        <>
            <div className='mt-6 flex justify-end'>
                <button
                    type='button'
                    onClick={() => setReportOpen(true)}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors'
                >
                    <BsExclamationTriangleFill className='text-[10px]' />
                    {label}
                </button>
            </div>
            {reportOpen && (
                <ContentReportModal
                    isOpen={reportOpen}
                    onClose={() => setReportOpen(false)}
                    targetType='siroh'
                    targetId={targetId}
                    targetTitle={targetTitle}
                    snippet={snippet}
                />
            )}
        </>
    );
}
