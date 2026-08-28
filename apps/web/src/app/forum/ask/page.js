"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { forumApi } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { MdQuestionAnswer } from "react-icons/md";

export function ForumAskContent({
    basePath = "/forum",
    loginNext = `${basePath}/ask`,
}) {
    const { t } = useLocale();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [tags, setTags] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    if (!isAuthenticated) {
        return (
            <div className='text-center py-16'>
                <p className='text-gray-500 dark:text-gray-400 text-sm mb-3'>
                    {t("forum.login_required") ??
                        "Login untuk mengajukan pertanyaan."}
                </p>
                <Link
                    href={`/auth/login?next=${encodeURIComponent(loginNext)}`}
                    className='inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors'
                >
                    {t("auth.login_btn") ?? "Login"}
                </Link>
            </div>
        );
    }

    const submit = async (e) => {
        e.preventDefault();
        if (title.length < 10) {
            setError(t("forum.title_too_short") ?? "Judul minimal 10 karakter");
            return;
        }
        if (body.length < 20) {
            setError(t("forum.body_too_short") ?? "Isi minimal 20 karakter");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await forumApi.create({ title, body, tags });
            const data = await res.json();
            if (res.ok) {
                router.push(`${basePath}/${data.slug}`);
            } else {
                setError(data?.message ?? "Gagal membuat pertanyaan");
            }
        } catch {
            setError("Network error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <ContentWidth compact='max-w-2xl' className='px-4 py-6'>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mb-4'>
                    <MdQuestionAnswer className='text-3xl text-blue-600 dark:text-blue-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-1'>
                    {t("forum.ask_title") ?? "Ajukan Pertanyaan"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("forum.ask_subtitle") ??
                        "Tanyakan sesuatu tentang Islam"}
                </p>
            </div>

            <form
                onSubmit={submit}
                className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-4'
            >
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t("forum.label_title") ?? "Judul"}
                    </label>
                    <input
                        type='text'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={
                            t("forum.title_placeholder") ??
                            "Tulis judul pertanyaan yang jelas..."
                        }
                        className='w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t("forum.label_body") ?? "Isi Pertanyaan"}
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        placeholder={
                            t("forum.body_placeholder") ??
                            "Jelaskan pertanyaan kamu secara detail..."
                        }
                        className='w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t("forum.label_tags") ?? "Tag (pisahkan dengan koma)"}
                    </label>
                    <input
                        type='text'
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder='fiqh, sholat, zakat'
                        className='w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                </div>

                {error && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                        {error}
                    </p>
                )}

                <button
                    type='submit'
                    disabled={saving}
                    className='w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                    <BsPlusLg />
                    {saving
                        ? (t("common.saving") ?? "Mengirim...")
                        : (t("forum.submit") ?? "Kirim Pertanyaan")}
                </button>
            </form>
        </ContentWidth>
    );
}

export default function ForumAskPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />
            <div className='pt-24'>
                <ForumAskContent />
            </div>
            <Footer />
        </main>
    );
}
