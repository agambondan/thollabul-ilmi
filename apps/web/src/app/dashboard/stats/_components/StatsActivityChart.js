"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function StatsActivityChart({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width='100%' height={200}>
            <LineChart data={data}>
                <XAxis dataKey='date' tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                    type='monotone'
                    dataKey='count'
                    stroke='#10b981'
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
