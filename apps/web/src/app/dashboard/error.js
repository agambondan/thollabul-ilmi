"use client";

import SegmentError from "@/components/SegmentError";

export default function DashboardError({ error, reset }) {
    return <SegmentError error={error} reset={reset} />;
}
