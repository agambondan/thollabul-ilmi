"use client";

import {
    PanelEmpty,
    PanelPage,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { useEffect, useState } from "react";
import { adminUserApi } from "@/lib/api";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { BsTrash } from "react-icons/bs";

const ROLES = [
    {
        value: "user",
        label: "User",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    {
        value: "author",
        label: "Author",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    {
        value: "editor",
        label: "Editor",
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    },
    {
        value: "admin",
        label: "Admin",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    },
];

const RoleBadge = ({ role, t }) => {
    const def = ROLES.find((r) => r.value === role) ?? ROLES[0];
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${def.color}`}
        >
            {t(`admin.role.${def.value}`)}
        </span>
    );
};

const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const { t } = useLocale();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [changingId, setChangingId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await adminUserApi.list();
                if (!res.ok) throw new Error(t("admin.users.load_error"));
                const data = await res.json();
                // The API returns a paginate.Page — { items, page, size,
                // total } — not { data }, which is why this list came back
                // empty. Same shape every other admin list reads.
                setUsers(data?.items ?? (Array.isArray(data) ? data : []));
            } catch (err) {
                setError(err.message || t("admin.error.load_data"));
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [t]);

    const handleChangeRole = async (target, newRole) => {
        if (target.role === newRole) return;
        const prev = users;
        setUsers((u) =>
            u.map((x) => (x.id === target.id ? { ...x, role: newRole } : x)),
        );
        setActionError("");
        setChangingId(target.id);
        try {
            const res = await adminUserApi.updateRole(target.id, newRole);
            if (!res.ok) throw new Error(t("admin.users.change_role_error"));
        } catch (err) {
            setUsers(prev);
            setActionError(err.message || t("admin.users.change_role_error"));
        } finally {
            setChangingId(null);
        }
    };

    const handleDelete = async (target) => {
        if (
            !confirm(
                t("admin.users.confirm_delete").replace("{name}", target.name),
            )
        )
            return;
        const prev = users;
        setUsers((u) => u.filter((x) => x.id !== target.id));
        setActionError("");
        try {
            const res = await adminUserApi.delete(target.id);
            if (!res.ok) throw new Error(t("admin.users.delete_error"));
        } catch (err) {
            setUsers(prev);
            setActionError(err.message || t("admin.users.delete_error"));
        }
    };

    if (isLoading) {
        return (
            <div className='p-8 text-center text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                {t("common.loading")}
            </div>
        );
    }

    const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const visible = users.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <PanelPage>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                    {t("admin.users.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-1'>
                    {t("admin.users.subtitle")}
                </p>
            </div>

            <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
                {ROLES.map((r) => {
                    const count = users.filter(
                        (u) => u.role === r.value,
                    ).length;
                    return (
                        <div
                            key={r.value}
                            className='bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-800 px-4 py-3 text-center'
                        >
                            <p className='text-xl font-bold text-gray-800 dark:text-gray-200 dark:text-white'>
                                {count}
                            </p>
                            <RoleBadge role={r.value} t={t} />
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className='mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm'>
                    {error}
                </div>
            )}

            {actionError && (
                <div className='mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm'>
                    {actionError}
                </div>
            )}

            <PanelTable
                head={
                    <>
                        <Th>{t("admin.field.name")}</Th>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th>{t("admin.users.change_role")}</Th>
                        <Th align='right'>{t("admin.field.actions")}</Th>
                    </>
                }
            >
                {visible.length === 0 && users.length === 0 && (
                    <Tr>
                        <Td
                            colSpan={5}
                            className='px-4 py-8 text-center text-gray-400 dark:text-gray-600 dark:text-gray-300'
                        >
                            {t("admin.users.empty")}
                        </Td>
                    </Tr>
                )}
                {visible.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                        <Tr
                            key={u.id}
                            className='hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors'
                        >
                            <Td className='text-gray-900 dark:text-gray-100 dark:text-white font-medium'>
                                {u.name}
                                {isSelf && (
                                    <span className='ml-2 text-xs text-emerald-600 dark:text-emerald-400'>
                                        ({t("admin.users.you")})
                                    </span>
                                )}
                            </Td>
                            <Td className='text-gray-600 dark:text-gray-300 dark:text-gray-400'>
                                {u.email}
                            </Td>
                            <Td>
                                <RoleBadge role={u.role} t={t} />
                            </Td>
                            <Td>
                                <select
                                    value={u.role}
                                    onChange={(e) =>
                                        handleChangeRole(u, e.target.value)
                                    }
                                    disabled={isSelf || changingId === u.id}
                                    className='text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed'
                                >
                                    {ROLES.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {t(`admin.role.${r.value}`)}
                                        </option>
                                    ))}
                                </select>
                                {changingId === u.id && (
                                    <span className='ml-2 text-xs text-gray-400'>
                                        {t("common.saving")}
                                    </span>
                                )}
                            </Td>
                            <Td>
                                <div className='flex justify-end'>
                                    <button
                                        onClick={() => handleDelete(u)}
                                        disabled={isSelf}
                                        title={t("admin.users.delete_user")}
                                        className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                                    >
                                        <BsTrash className='text-sm' />
                                        {t("common.delete")}
                                    </button>
                                </div>
                            </Td>
                        </Tr>
                    );
                })}
            </PanelTable>

            <PanelPagination
                page={currentPage}
                pageCount={pageCount}
                total={users.length}
                onChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                }}
                pageSizeOptions={[10, 20, 50]}
                labels={{
                    prev: t("common.prev"),
                    next: t("common.next"),
                }}
            />

            <div className='mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs'>
                <strong>{t("admin.users.role_notes_title")}:</strong>{" "}
                {t("admin.users.role_notes")}
            </div>
        </PanelPage>
    );
};

export default AdminUsersPage;
