"use client";

import { useLocale } from "@/context/Locale";
import { userApi } from "@/lib/api";
import { useState } from "react";
import { BsChevronDown, BsChevronUp, BsLock } from "react-icons/bs";

// Kept byte-identical to the field styling the /profile page already used, so
// extracting this card changes nothing visually there.
const INPUT_CLS =
    "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

/**
 * Collapsible "change password" card.
 *
 * Lives here rather than in a page because the app has two profile screens —
 * /profile and /dashboard/profile — and the password form existed only on the
 * first one, so anyone who reached the second (the link the dashboard sidebar
 * points at) had no way to change their password at all.
 */
const ChangePasswordCard = ({ className = "" }) => {
    const { t } = useLocale();
    const [open, setOpen] = useState(false);
    const [oldPwd, setOldPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
            setMsg({ type: "error", text: t("profile.password_mismatch") });
            return;
        }
        if (newPwd.length < 8) {
            setMsg({ type: "error", text: t("profile.password_min") });
            return;
        }
        setLoading(true);
        setMsg({ type: "", text: "" });
        try {
            const res = await userApi.changePassword(oldPwd, newPwd);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.message || t("profile.old_password_wrong"),
                );
            }
            setMsg({ type: "success", text: t("profile.password_success") });
            setOldPwd("");
            setNewPwd("");
            setConfirmPwd("");
            setOpen(false);
        } catch (err) {
            setMsg({
                type: "error",
                text: err.message || t("profile.password_error"),
            });
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
                    <BsLock className='text-emerald-600 dark:text-emerald-400' />
                    {t("profile.change_password")}
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
                        <label
                            htmlFor='changepasswordcard-old-password'
                            className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                        >
                            {t("profile.old_password")}
                        </label>
                        <input
                            id='changepasswordcard-old-password'
                            type='password'
                            value={oldPwd}
                            onChange={(e) => setOldPwd(e.target.value)}
                            required
                            className={INPUT_CLS}
                            placeholder='••••••••'
                        />
                    </div>
                    <div>
                        <label
                            htmlFor='changepasswordcard-new-password'
                            className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                        >
                            {t("profile.new_password")}
                        </label>
                        <input
                            id='changepasswordcard-new-password'
                            type='password'
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            required
                            minLength={8}
                            className={INPUT_CLS}
                            placeholder={t("auth.min_chars")}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor='changepasswordcard-confirm-new-password'
                            className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                        >
                            {t("profile.confirm_new_password")}
                        </label>
                        <input
                            id='changepasswordcard-confirm-new-password'
                            type='password'
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            required
                            className={INPUT_CLS}
                            placeholder={t("profile.repeat_new_password")}
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={loading}
                        className='px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors'
                    >
                        {loading
                            ? t("common.saving")
                            : t("profile.change_password_btn")}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ChangePasswordCard;
