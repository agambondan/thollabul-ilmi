"use client";

import { useLocale } from "@/context/Locale";
import { userApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsChevronDown, BsChevronUp, BsPersonGear } from "react-icons/bs";

// Same field styling as the other account cards.
const INPUT_CLS =
    "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

/**
 * Collapsible "edit profile" card.
 *
 * Deliberately the same shape as ChangePasswordCard and the language card: a
 * full-width header row that expands in place. It used to be a small text link
 * tucked inside the avatar block, which read as a different kind of control
 * from its neighbours even though it does the same sort of thing.
 */
const EditProfileCard = ({ user, refetchUser, className = "" }) => {
    const { t } = useLocale();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        if (user?.name) setName(user.name);
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setMsg({ type: "", text: "" });
        try {
            const res = await userApi.updateMe(user.id, { name: name.trim() });
            if (!res.ok) throw new Error();
            refetchUser?.();
            setMsg({ type: "success", text: t("profile.update_success") });
            setOpen(false);
        } catch {
            setMsg({ type: "error", text: t("profile.update_error") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden ${className}`}
        >
            <button
                type='button'
                onClick={() => {
                    setOpen((v) => !v);
                    setMsg({ type: "", text: "" });
                }}
                className='w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
            >
                <span className='flex items-center gap-2'>
                    <BsPersonGear className='text-emerald-600 dark:text-emerald-400' />
                    {t("profile.edit_profile")}
                </span>
                {open ? <BsChevronUp /> : <BsChevronDown />}
            </button>

            {open && (
                <form
                    onSubmit={handleSubmit}
                    className='px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-700 space-y-4'
                >
                    {msg.text && (
                        <p
                            className={`text-sm ${msg.type === "error" ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                        >
                            {msg.text}
                        </p>
                    )}
                    <div>
                        <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                            {t("auth.name")}
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className={INPUT_CLS}
                        />
                    </div>
                    <div>
                        <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                            Email
                        </label>
                        {/* Read-only: the account is keyed on it and there is no
                            change-email flow behind the API yet. */}
                        <input
                            value={user?.email ?? ""}
                            disabled
                            className={`${INPUT_CLS} cursor-not-allowed opacity-60`}
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors'
                        >
                            {loading ? t("common.saving") : t("common.save")}
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                setOpen(false);
                                setName(user?.name ?? "");
                                setMsg({ type: "", text: "" });
                            }}
                            className='px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700'
                        >
                            {t("common.cancel")}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EditProfileCard;
