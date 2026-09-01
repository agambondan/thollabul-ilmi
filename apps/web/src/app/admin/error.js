"use client";

import SegmentError from "@/components/SegmentError";

export default function AdminError({ error, reset }) {
    return <SegmentError error={error} reset={reset} />;
}
