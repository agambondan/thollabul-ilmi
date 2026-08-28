"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { developerApi } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BsArrowClockwise,
    BsCheckCircle,
    BsCopy,
    BsKey,
    BsTrash,
} from "react-icons/bs";

const cardCls =
    "rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm";

const formatDate = (value, lang, fallback) => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleString(lang === "EN" ? "en-US" : "id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const DeveloperKeyManager = () => {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { lang, t } = useLocale();
    const [keys, setKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);
    const [revokingId, setRevokingId] = useState(null);
    const [createdKey, setCreatedKey] = useState("");
    const [copyMessage, setCopyMessage] = useState("");

    const loadKeys = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        setError("");
        try {
            const res = await developerApi.listKeys();
            if (!res.ok) throw new Error(t("dev.keys.load_error"));
            const data = await res.json();
            const items = Array.isArray(data)
                ? data
                : (data?.items ?? data?.data ?? []);
            setKeys(items);
        } catch (err) {
            setError(err.message || t("dev.keys.load_error"));
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, t]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadKeys();
        }
        if (!isAuthenticated) {
            setKeys([]);
            setCreatedKey("");
            setCopyMessage("");
            setError("");
        }
    }, [authLoading, isAuthenticated, loadKeys]);

    const totalRequestCount = useMemo(
        () => keys.reduce((sum, item) => sum + (item.request_count ?? 0), 0),
        [keys],
    );

    const handleCreate = async (event) => {
        event.preventDefault();
        const name = createName.trim();
        if (!name) return;

        setCreating(true);
        setError("");
        setCopyMessage("");
        try {
            const res = await developerApi.createKey(name);
            if (!res.ok) throw new Error(t("dev.keys.create_error"));
            const data = await res.json();
            if (data?.key) {
                setCreatedKey(data.key);
                setCreateName("");
            }
            await loadKeys();
        } catch (err) {
            setError(err.message || t("dev.keys.create_error"));
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!confirm(t("dev.keys.confirm_revoke"))) return;
        setRevokingId(id);
        setError("");
        try {
            const res = await developerApi.revokeKey(id);
            if (!res.ok) throw new Error(t("dev.keys.revoke_error"));
            setKeys((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            setError(err.message || t("dev.keys.revoke_error"));
        } finally {
            setRevokingId(null);
        }
    };

    const handleCopyKey = async () => {
        if (!createdKey) return;
        try {
            await navigator.clipboard.writeText(createdKey);
            setCopyMessage(t("dev.keys.copy_success"));
        } catch {
            setCopyMessage(t("dev.keys.copy_error"));
        }
    };

    if (authLoading) {
        return (
            <div className={`${cardCls} p-5`}>
                <div className='animate-pulse space-y-3'>
                    <div className='h-5 w-48 rounded bg-gray-200 dark:bg-slate-700' />
                    <div className='h-4 w-72 rounded bg-gray-200 dark:bg-slate-700' />
                    <div className='h-24 rounded-xl bg-gray-100 dark:bg-slate-700' />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className={`${cardCls} p-6`}>
                <div className='flex items-start gap-3'>
                    <div className='rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-2 text-emerald-700 dark:text-emerald-400'>
                        <BsKey className='text-xl' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                            {t("dev.keys.guest_title")}
                        </h2>
                        <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                            {t("dev.keys.guest_desc")}
                        </p>
                        <Link
                            href='/auth/login'
                            className='mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800'
                        >
                            {t("nav.login")}
                            <BsArrowClockwise />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-5'>
            <div className={`${cardCls} p-6`}>
                <div className='flex items-start justify-between gap-4'>
                    <div>
                        <div className='inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
                            <BsKey />
                            Developer Access
                        </div>
                        <h2 className='mt-3 text-xl font-bold text-gray-900 dark:text-white'>
                            {t("dev.keys.title")}
                        </h2>
                        <p className='mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400'>
                            {t("dev.keys.desc")}
                        </p>
                    </div>
                    <div className='rounded-2xl bg-slate-50 px-4 py-3 text-right dark:bg-slate-900/60'>
                        <p className='text-xs uppercase tracking-wide text-gray-400'>
                            {t("dev.keys.total_request")}
                        </p>
                        <p className='text-2xl font-extrabold text-emerald-700 dark:text-emerald-400'>
                            {totalRequestCount}
                        </p>
                    </div>
                </div>

                {user?.name && (
                    <p className='mt-4 text-xs text-gray-400'>
                        {t("dev.keys.signed_in_as")} {user.name}
                    </p>
                )}
            </div>

            {createdKey && (
                <div
                    className={`${cardCls} border-emerald-200 dark:border-emerald-800 p-5`}
                >
                    <div className='flex items-start gap-3'>
                        <BsCheckCircle className='mt-0.5 text-emerald-600 dark:text-emerald-400' />
                        <div className='flex-1'>
                            <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>
                                {t("dev.keys.created_title")}
                            </p>
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                {t("dev.keys.created_desc")}
                            </p>
                            <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center'>
                                <code className='block flex-1 rounded-xl bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-300 break-all'>
                                    {createdKey}
                                </code>
                                <button
                                    type='button'
                                    onClick={handleCopyKey}
                                    className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800'
                                >
                                    <BsCopy />
                                    {t("common.copy")}
                                </button>
                            </div>
                            {copyMessage && (
                                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                                    {copyMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`${cardCls} p-5`}>
                <form
                    onSubmit={handleCreate}
                    className='flex flex-col gap-3 sm:flex-row'
                >
                    <input
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder={t("dev.keys.name_placeholder")}
                        className='flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                    />
                    <button
                        type='submit'
                        disabled={creating || !createName.trim()}
                        className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                        <BsKey />
                        {creating
                            ? t("dev.keys.creating")
                            : t("dev.keys.create_btn")}
                    </button>
                </form>
            </div>

            {error && (
                <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'>
                    {error}
                </div>
            )}

            <div className={`${cardCls} overflow-hidden`}>
                <div className='border-b border-gray-100 px-5 py-4 dark:border-slate-700'>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {t("dev.keys.active_title")}
                    </h3>
                </div>

                {isLoading ? (
                    <div className='space-y-3 p-5'>
                        {[...Array(2)].map((_, index) => (
                            <div
                                key={index}
                                className='h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-700'
                            />
                        ))}
                    </div>
                ) : keys.length === 0 ? (
                    <div className='p-6 text-center text-sm text-gray-500 dark:text-gray-400'>
                        {t("dev.keys.empty")}
                    </div>
                ) : (
                    <div className='divide-y divide-gray-100 dark:divide-slate-700'>
                        {keys.map((item) => (
                            <div
                                key={item.id}
                                className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'
                            >
                                <div className='space-y-2'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
                                            {item.name}
                                        </h4>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                item.is_active
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                    : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                                            }`}
                                        >
                                            {item.is_active
                                                ? t("common.active")
                                                : t("common.inactive")}
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        Prefix:{" "}
                                        <span className='font-mono'>
                                            {item.key_prefix}
                                        </span>
                                    </p>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {t("dev.keys.request_count")}:{" "}
                                        {item.request_count ?? 0} ·{" "}
                                        {t("dev.keys.last_used")}:{" "}
                                        {formatDate(
                                            item.last_used_at,
                                            lang,
                                            t("dev.keys.never_used"),
                                        )}
                                    </p>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => handleRevoke(item.id)}
                                        disabled={revokingId === item.id}
                                        className='inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20'
                                    >
                                        <BsTrash />
                                        {revokingId === item.id
                                            ? t("dev.keys.revoking")
                                            : t("dev.keys.revoke")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeveloperKeyManager;
