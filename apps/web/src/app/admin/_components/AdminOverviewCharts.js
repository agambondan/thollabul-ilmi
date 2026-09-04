"use client";

import { useLocale } from "@/context/Locale";
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const CHART_COLORS = ["#047857", "#0f766e", "#b45309", "#475569", "#7c3aed"];
const CHART_INITIAL_DIMENSIONS = {
    h40: { width: 320, height: 160 },
    h44: { width: 320, height: 176 },
    h48: { width: 320, height: 192 },
    h56: { width: 320, height: 224 },
    h64: { width: 320, height: 256 },
};

const shortTick = (text, max = 12) => {
    if (!text || text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
};

export default function AdminOverviewCharts({
    overview,
    contentHealthChart,
    reviewQueueChart,
}) {
    const { t } = useLocale();

    return (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2'>
                <div className='mb-4 flex items-start justify-between gap-4'>
                    <div>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {t("admin.metrics.content_chart")}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                            {t("admin.metrics.content_chart_desc")}
                        </p>
                    </div>
                </div>
                <div className='grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='h-64 min-w-0 w-full'>
                        <ResponsiveContainer
                            width='100%'
                            height='100%'
                            initialDimension={CHART_INITIAL_DIMENSIONS.h64}
                        >
                            <BarChart
                                data={overview.contentMix}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    bottom: 8,
                                    left: 0,
                                }}
                            >
                                <XAxis
                                    dataKey='name'
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <Tooltip
                                    cursor={{
                                        fill: "rgba(4, 120, 87, 0.08)",
                                    }}
                                    contentStyle={{
                                        borderRadius: 12,
                                        borderColor: "#e2e8f0",
                                        fontSize: 12,
                                    }}
                                />
                                <Bar dataKey='value' radius={[8, 8, 0, 0]}>
                                    {overview.contentMix.map((_, index) => (
                                        <Cell
                                            key={`content-${index}`}
                                            fill={
                                                CHART_COLORS[
                                                    index % CHART_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='min-w-0'>
                        <div className='flex items-center justify-between gap-4'>
                            <div>
                                <p className='text-xs font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                                    {t("admin.metrics.status_chart")}
                                </p>
                                <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                    {t("admin.metrics.status_chart_desc")}
                                </p>
                            </div>
                        </div>
                        <div className='h-48 min-w-0 w-full'>
                            <ResponsiveContainer
                                width='100%'
                                height='100%'
                                initialDimension={CHART_INITIAL_DIMENSIONS.h48}
                            >
                                <PieChart>
                                    <Pie
                                        data={overview.statusMix}
                                        dataKey='value'
                                        nameKey='name'
                                        innerRadius={50}
                                        outerRadius={74}
                                        paddingAngle={3}
                                    >
                                        {overview.statusMix.map((_, index) => (
                                            <Cell
                                                key={`status-${index}`}
                                                fill={
                                                    CHART_COLORS[
                                                        index %
                                                            CHART_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: "#e2e8f0",
                                            fontSize: 12,
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className='mt-5 grid min-w-0 grid-cols-1 gap-5 border-t border-gray-100 pt-5 dark:border-slate-700 lg:grid-cols-2'>
                    <div className='min-w-0'>
                        <div className='mb-3'>
                            <p className='text-xs font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                                {t("admin.metrics.content_health_chart")}
                            </p>
                            <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                {t("admin.metrics.content_health_chart_desc")}
                            </p>
                        </div>
                        <div className='h-56 min-w-0 w-full'>
                            <ResponsiveContainer
                                width='100%'
                                height='100%'
                                initialDimension={CHART_INITIAL_DIMENSIONS.h56}
                            >
                                <BarChart
                                    data={contentHealthChart}
                                    layout='vertical'
                                    margin={{
                                        top: 4,
                                        right: 18,
                                        bottom: 4,
                                        left: 12,
                                    }}
                                >
                                    <XAxis
                                        type='number'
                                        domain={[0, 100]}
                                        tickFormatter={(value) => `${value}%`}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#64748b",
                                        }}
                                    />
                                    <YAxis
                                        type='category'
                                        dataKey='name'
                                        width={92}
                                        tickFormatter={(value) =>
                                            shortTick(value, 14)
                                        }
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#64748b",
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value, name, props) => [
                                            `${value}% (${props.payload.value}/${props.payload.total})`,
                                            t("admin.metrics.ready"),
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: "#e2e8f0",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey='percent'
                                        fill='#047857'
                                        radius={[0, 6, 6, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className='min-w-0'>
                        <div className='mb-3'>
                            <p className='text-xs font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                                {t("admin.metrics.review_queue_chart")}
                            </p>
                            <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                {t("admin.metrics.review_queue_chart_desc")}
                            </p>
                        </div>
                        <div className='h-56 min-w-0 w-full'>
                            <ResponsiveContainer
                                width='100%'
                                height='100%'
                                initialDimension={CHART_INITIAL_DIMENSIONS.h56}
                            >
                                <BarChart
                                    data={reviewQueueChart}
                                    margin={{
                                        top: 6,
                                        right: 8,
                                        bottom: 8,
                                        left: -12,
                                    }}
                                >
                                    <XAxis
                                        dataKey='name'
                                        tickFormatter={(value) =>
                                            shortTick(value, 12)
                                        }
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#64748b",
                                        }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#64748b",
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [
                                            value,
                                            t("admin.metrics.review_items"),
                                        ]}
                                        cursor={{
                                            fill: "rgba(180, 83, 9, 0.08)",
                                        }}
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: "#e2e8f0",
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey='count'
                                        fill='#b45309'
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid min-w-0 grid-cols-1 gap-4'>
                <div className='min-w-0 rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                    <h2 className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.metrics.role_chart")}
                    </h2>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("admin.metrics.role_chart_desc")}
                    </p>
                    <div className='mt-4 h-44 min-w-0 w-full'>
                        <ResponsiveContainer
                            width='100%'
                            height='100%'
                            initialDimension={CHART_INITIAL_DIMENSIONS.h44}
                        >
                            <PieChart>
                                <Pie
                                    data={overview.roles}
                                    dataKey='value'
                                    nameKey='role'
                                    innerRadius={46}
                                    outerRadius={70}
                                    paddingAngle={3}
                                >
                                    {overview.roles.map((_, index) => (
                                        <Cell
                                            key={`role-${index}`}
                                            fill={
                                                CHART_COLORS[
                                                    index % CHART_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [
                                        value,
                                        t(`admin.role.${name}`),
                                    ]}
                                    contentStyle={{
                                        borderRadius: 12,
                                        borderColor: "#e2e8f0",
                                        fontSize: 12,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='mt-3 grid grid-cols-2 gap-2'>
                        {overview.roles.map((role, index) => (
                            <div
                                key={role.role}
                                className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'
                            >
                                <span
                                    className='h-2.5 w-2.5 rounded-full'
                                    style={{
                                        backgroundColor:
                                            CHART_COLORS[
                                                index % CHART_COLORS.length
                                            ],
                                    }}
                                />
                                <span>{t(role.nameKey)}</span>
                                <span className='font-semibold text-gray-800 dark:text-gray-200'>
                                    {role.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='min-w-0 rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                    <div className='mb-4 flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                                {t("admin.metrics.source_chart")}
                            </h2>
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                {t("admin.metrics.source_chart_desc")}
                            </p>
                        </div>
                    </div>
                    <div className='h-44 min-w-0 w-full'>
                        <ResponsiveContainer
                            width='100%'
                            height='100%'
                            initialDimension={CHART_INITIAL_DIMENSIONS.h44}
                        >
                            <PieChart>
                                <Pie
                                    data={overview.sourceBreakdown}
                                    dataKey='visitors'
                                    nameKey='source'
                                    innerRadius={46}
                                    outerRadius={70}
                                    paddingAngle={3}
                                >
                                    {overview.sourceBreakdown.map(
                                        (_, index) => (
                                            <Cell
                                                key={`source-${index}`}
                                                fill={
                                                    CHART_COLORS[
                                                        index %
                                                            CHART_COLORS.length
                                                    ]
                                                }
                                            />
                                        ),
                                    )}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [
                                        value,
                                        t(`admin.source.${name}`),
                                    ]}
                                    contentStyle={{
                                        borderRadius: 12,
                                        borderColor: "#e2e8f0",
                                        fontSize: 12,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='mt-3 grid grid-cols-2 gap-2'>
                        {overview.sourceBreakdown.map((item, index) => (
                            <div
                                key={item.source}
                                className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'
                            >
                                <span
                                    className='h-2.5 w-2.5 rounded-full'
                                    style={{
                                        backgroundColor:
                                            CHART_COLORS[
                                                index % CHART_COLORS.length
                                            ],
                                    }}
                                />
                                <span>{t(`admin.source.${item.source}`)}</span>
                                <span className='font-semibold text-gray-800 dark:text-gray-200'>
                                    {item.visitors}
                                </span>
                            </div>
                        ))}
                        {!overview.loading &&
                        overview.sourceBreakdown.length === 0 ? (
                            <p className='col-span-2 text-xs text-gray-400'>
                                {t("admin.metrics.no_visitor_data")}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className='min-w-0 rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                    <h2 className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.metrics.visitor_chart")}
                    </h2>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("admin.metrics.visitor_chart_desc")}
                    </p>
                    <div className='mt-4 h-40 min-w-0 w-full'>
                        <ResponsiveContainer
                            width='100%'
                            height='100%'
                            initialDimension={CHART_INITIAL_DIMENSIONS.h40}
                        >
                            <BarChart
                                data={overview.analytics?.daily ?? []}
                                margin={{
                                    top: 4,
                                    right: 4,
                                    bottom: 4,
                                    left: -16,
                                }}
                            >
                                <XAxis
                                    dataKey='date'
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: "#64748b" }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: "#64748b" }}
                                />
                                <Tooltip
                                    cursor={{
                                        fill: "rgba(180, 83, 9, 0.08)",
                                    }}
                                    contentStyle={{
                                        borderRadius: 12,
                                        borderColor: "#e2e8f0",
                                        fontSize: 12,
                                    }}
                                />
                                <Bar
                                    dataKey='visitors'
                                    fill='#b45309'
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className='mt-4 border-t border-gray-100 pt-3 dark:border-slate-700'>
                        <p className='mb-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                            {t("admin.metrics.top_pages_source")}
                        </p>
                        <p className='mb-3 text-xs text-gray-400'>
                            {t("admin.metrics.top_pages_source_desc")}
                        </p>
                        {overview.topPagesBySource.length > 0 ? (
                            (() => {
                                const groups = {};
                                overview.topPagesBySource.forEach((p) => {
                                    if (!groups[p.source]) groups[p.source] = [];
                                    groups[p.source].push(p);
                                });
                                return (
                                    <div className='grid grid-cols-2 gap-2'>
                                        {Object.entries(groups).map(
                                            ([source, pages]) => (
                                                <div
                                                    key={source}
                                                    className='rounded-lg bg-gray-50 p-2 dark:bg-slate-700/50'
                                                >
                                                    <p className='mb-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300'>
                                                        {t(
                                                            `admin.source.${source}`,
                                                        )}
                                                    </p>
                                                    {pages
                                                        .slice(0, 3)
                                                        .map((page) => (
                                                            <div
                                                                key={`${source}-${page.path}`}
                                                                className='flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-300 dark:text-gray-400'
                                                            >
                                                                <span
                                                                    className='truncate max-w-[120px]'
                                                                    title={
                                                                        page.path
                                                                    }
                                                                >
                                                                    {page.path}
                                                                </span>
                                                                <span className='font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                                                    {
                                                                        page.visitors
                                                                    }
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <p className='text-xs text-gray-400'>
                                {t("admin.metrics.no_top_pages_data")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
