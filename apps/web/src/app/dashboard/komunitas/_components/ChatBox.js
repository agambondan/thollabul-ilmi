"use client";

import { useLocale } from "@/context/Locale";
import { useAuth } from "@/context/Auth";
import { useEffect, useState, useRef } from "react";
import {
    getChatMessages,
    postChatMessage,
    deleteChatMessage,
    subscribeChat,
} from "@/lib/komunitasApi";
import { BsSendFill, BsTrash } from "react-icons/bs";
import Link from "next/link";

export default function ChatBox() {
    const { t } = useLocale();
    const { user, isAuthenticated } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef(null);

    const isAdmin = user?.role === "admin";

    useEffect(() => {
        getChatMessages().then(setMessages);
        const unsub = subscribeChat((newMsg) => {
            setMessages((prev) =>
                prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
            );
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !isAuthenticated) return;
        const currentText = input;
        setInput("");
        const msg = await postChatMessage({
            text: currentText,
            author: user?.name,
            authorId: user?.id,
        });
        if (msg) {
            setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
            );
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus pesan ini?")) return;
        const ok = await deleteChatMessage(id);
        if (ok) {
            setMessages((prev) => prev.filter((m) => m.id !== id));
        }
    };

    return (
        <div className='flex flex-col h-96 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden'>
            <div className='p-3 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 font-bold text-sm text-gray-900 dark:text-gray-100 dark:text-white flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>
                    {t("komunitas.chat")}
                </div>
                {isAdmin && (
                    <span className='text-[10px] text-amber-500 font-bold'>
                        {t("komunitas.admin_mode")}
                    </span>
                )}
            </div>

            <div
                ref={scrollRef}
                className='flex-1 overflow-y-auto p-4 space-y-3'
            >
                {messages.length === 0 ? (
                    <p className='text-center text-xs text-gray-400 mt-10'>
                        {t("komunitas.chat_empty")}
                    </p>
                ) : (
                    messages.map((m) => {
                        const isMe = m.authorId === user?.id && !!user?.id;
                        return (
                            <div
                                key={m.id}
                                className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div className='flex items-center gap-1.5 mb-0.5 px-1'>
                                    <span className='text-[10px] text-gray-400'>
                                        {m.author}
                                    </span>
                                    {(isAdmin || isMe) && (
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className='opacity-0 group-hover:opacity-100 text-rose-500 text-[10px] hover:underline'
                                            title={t("common.delete_message")}
                                        >
                                            <BsTrash />
                                        </button>
                                    )}
                                </div>
                                <div
                                    className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words ${isMe ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-none shadow-sm"}`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className='p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700'>
                {isAuthenticated ? (
                    <form onSubmit={handleSend} className='flex gap-2'>
                        <input
                            type='text'
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t("komunitas.chat_placeholder")}
                            className='flex-1 px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        <button
                            type='submit'
                            disabled={!input.trim()}
                            className='p-2 bg-emerald-600 text-white rounded-full disabled:opacity-50 hover:bg-emerald-700 transition-colors'
                        >
                            <BsSendFill />
                        </button>
                    </form>
                ) : (
                    <p className='text-xs text-center text-gray-500 dark:text-gray-300'>
                        {t("feed.login_required")}{" "}
                        <Link
                            href='/auth/login'
                            className='text-emerald-600 font-bold hover:underline'
                        >
                            {t("nav.login")}
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
