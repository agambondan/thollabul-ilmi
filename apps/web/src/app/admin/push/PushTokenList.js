"use client";

import { useEffect, useMemo, useState } from "react";
import { BsTrash } from "react-icons/bs";
import { notificationApi, parseApiError } from "@/lib/api";
import {
    PanelTable,
    Th,
    Td,
    Tr,
    PanelEmpty,
} from "@/components/panel/DataPanel";

const formatDate = (value) => {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return value;
    }
};

export default function PushTokenList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await notificationApi.listAllPushTokens();
            const data = await res.json();
            if (!res.ok) {
                throw new Error(
                    data?.message || data?.error || "Gagal memuat data",
                );
            }
            setItems(Array.isArray(data) ? data : (data?.data ?? []));
        } catch (err) {
            setError(err.message || "Gagal memuat data");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return items;
        return items.filter((it) =>
            [it.user_name, it.user_email, it.device_id, it.city_name]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(needle)),
        );
    }, [items, search]);

    const activeCount = items.filter((it) => it.is_active).length;

    const remove = async (item) => {
        if (
            !confirm(
                `Hapus token perangkat ${item.device_id || item.id}? Perangkat ini tidak akan menerima notifikasi lagi.`,
            )
        )
            return;
        setDeleting(item.id);
        try {
            const res = await notificationApi.deletePushToken(item.id);
            if (!res.ok) {
                throw new Error(
                    await parseApiError(res, "Gagal menghapus token"),
                );
            }
            setItems((prev) => prev.filter((it) => it.id !== item.id));
        } catch (err) {
            alert(err.message || "Gagal menghapus token");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className='mt-8'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3'>
                <div>
                    <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                        Perangkat Terdaftar
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} total token · {activeCount} aktif
                    </p>
                </div>
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Cari nama, email, device, kota...'
                    className='px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'
                />
            </div>

            {loading ? (
                <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-6'>
                    Memuat data…
                </p>
            ) : error ? (
                <p className='text-center text-sm text-red-500 py-6'>{error}</p>
            ) : (
                <>
                    <PanelTable
                        head={
                            <>
                                <Th>Pengguna</Th>
                                <Th>Platform</Th>
                                <Th>Device ID</Th>
                                <Th>Kota</Th>
                                <Th>Terakhir Aktif</Th>
                                <Th>Status</Th>
                                <Th className='text-right'>Aksi</Th>
                            </>
                        }
                    >
                        {filtered.length === 0 ? (
                            <PanelEmpty colSpan={7}>
                                {search
                                    ? "Tidak ada yang cocok dengan pencarian."
                                    : "Belum ada perangkat terdaftar."}
                            </PanelEmpty>
                        ) : (
                            filtered.map((item) => (
                                <Tr key={item.id}>
                                    <Td>
                                        <div className='font-medium text-gray-900 dark:text-gray-100'>
                                            {item.user_name || "—"}
                                        </div>
                                        <div className='text-xs text-gray-400'>
                                            {item.user_email || item.user_id}
                                        </div>
                                    </Td>
                                    <Td>
                                        {item.platform}
                                        {item.provider
                                            ? ` (${item.provider})`
                                            : ""}
                                    </Td>
                                    <Td className='max-w-[180px] truncate'>
                                        {item.device_id || "—"}
                                    </Td>
                                    <Td>{item.city_name || "—"}</Td>
                                    <Td>{formatDate(item.last_seen_at)}</Td>
                                    <Td>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                item.is_active
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                                            }`}
                                        >
                                            {item.is_active
                                                ? "Aktif"
                                                : "Nonaktif"}
                                        </span>
                                    </Td>
                                    <Td className='text-right whitespace-nowrap'>
                                        <button
                                            type='button'
                                            onClick={() => remove(item)}
                                            disabled={deleting === item.id}
                                            className='inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-semibold disabled:opacity-50'
                                        >
                                            <BsTrash /> Hapus
                                        </button>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </PanelTable>
                </>
            )}
        </div>
    );
}
