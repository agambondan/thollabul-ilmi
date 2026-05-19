'use client';

import { adminDoaApi } from '@/lib/api';
import { useLocale } from '@/context/Locale';
import { getLocalizedField } from '@/lib/translation';
import { useEffect, useState } from 'react';
import { BsPencil, BsPlusCircle, BsTrash, BsX } from 'react-icons/bs';

const CATEGORIES = ['pagi', 'petang', 'makan', 'tidur', 'safar', 'ibadah', 'umum'];

const EMPTY_FORM = {
    title: '',
    arabic: '',
    transliteration: '',
    translation: '',
    category: 'umum',
    source: '',
};

const AdminPrayersPage = () => {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminDoaApi.list(0, 500);
            const data = await r.json();
            setItems(data?.items ?? data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditId(item.id ?? item._id);
        setForm({
            title: item.translation?.idn ?? item.title ?? '',
            arabic: item.translation?.ar ?? item.arabic ?? '',
            transliteration: item.translation?.latin_idn ?? item.transliteration ?? '',
            translation: item.translation?.description_idn ?? '',
            category: item.category ?? 'umum',
            source: item.source ?? '',
        });
        setShowModal(true);
    };

    const fb = (type, msg) =>
        window.dispatchEvent(new CustomEvent(type, { detail: { message: msg } }));

    const save = async () => {
        setSaving(true);
        try {
            let res;
            if (editId) {
                res = await adminDoaApi.update(editId, form);
            } else {
                res = await adminDoaApi.create(form);
            }
            if (!res.ok) throw new Error(t('admin.error.save'));
            setShowModal(false);
            load();
            fb('admin:success', t('admin.crud.save_success'));
        } catch (err) {
            fb('admin:mutation-error', err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await adminDoaApi.delete(deleteId);
            if (!res.ok) throw new Error(t('admin.error.save'));
            setDeleteId(null);
            load();
            fb('admin:success', t('admin.crud.delete_success'));
        } catch (err) {
            fb('admin:mutation-error', err.message);
        }
    };

    const filtered = items.filter(
        (i) =>
            i.title?.toLowerCase().includes(search.toLowerCase()) ||
            i.category?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>{t('admin.nav.prayers')}</h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} {t('admin.crud.entries')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t('admin.crud.add')} {t('admin.nav.prayers')}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t('admin.crud.search_title_category')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                />
            </div>

            {loading ? (
                <p className='text-sm text-gray-500'>{t('common.loading')}</p>
            ) : (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-50 dark:bg-slate-700'>
                            <tr>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300'>
                                    {t('admin.field.title')}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28'>
                                    {t('admin.field.category')}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                    {t('common.source')}
                                </th>
                                <th className='px-4 py-3 w-20'></th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                            {filtered.map((item) => (
                                <tr
                                    key={item.id ?? item._id}
                                    className='hover:bg-gray-50 dark:hover:bg-slate-750'
                                >
                                    <td className='px-4 py-3 text-gray-900 dark:text-white font-medium'>
                                        {getLocalizedField(item, 'title', lang)}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <span className='px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs'>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell'>
                                        {item.source ?? '-'}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <div className='flex items-center gap-2 justify-end'>
                                            <button
                                                onClick={() => openEdit(item)}
                                                aria-label={t('common.edit')}
                                                title={t('common.edit')}
                                                className='p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded'
                                            >
                                                <BsPencil />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setDeleteId(item.id ?? item._id)
                                                }
                                                aria-label={t('common.delete')}
                                                title={t('common.delete')}
                                                className='p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                            >
                                                <BsTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className='px-4 py-8 text-center text-gray-400'
                                    >
                                        {t('admin.crud.no_data')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Create/Edit */}
            {showModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                            <h2 className='font-bold text-gray-900 dark:text-white'>
                                {editId
                                    ? `${t('common.edit')} ${t('admin.nav.prayers')}`
                                    : `${t('admin.crud.add')} ${t('admin.nav.prayers')}`}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>
                        <div className='p-5 space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('admin.field.title')}
                                </label>
                                <input
                                    type='text'
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({ ...form, title: e.target.value })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('admin.field.arabic')}
                                </label>
                                <textarea
                                    value={form.arabic}
                                    onChange={(e) =>
                                        setForm({ ...form, arabic: e.target.value })
                                    }
                                    rows={3}
                                    dir='rtl'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-arabic text-lg leading-loose'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('admin.field.latin')}
                                </label>
                                <textarea
                                    value={form.transliteration}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            transliteration: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('common.translation')}
                                </label>
                                <textarea
                                    value={form.translation}
                                    onChange={(e) =>
                                        setForm({ ...form, translation: e.target.value })
                                    }
                                    rows={2}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('admin.field.category')}
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm({ ...form, category: e.target.value })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('common.source')}
                                </label>
                                <input
                                    type='text'
                                    value={form.source}
                                    onChange={(e) =>
                                        setForm({ ...form, source: e.target.value })
                                    }
                                    placeholder='e.g. HR. Bukhari No. 123'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                        </div>
                        <div className='flex gap-3 p-5 border-t border-gray-100 dark:border-slate-700'>
                            <button
                                onClick={() => setShowModal(false)}
                                className='flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700'
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={save}
                                disabled={saving || !form.title}
                                className='flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium'
                            >
                                {saving ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'>
                        <h2 className='font-bold text-gray-900 dark:text-white mb-2'>
                            {t('admin.crud.delete_title').replace('{item}', t('admin.nav.prayers'))}
                        </h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mb-5'>
                            {t('admin.crud.delete_body')}
                        </p>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setDeleteId(null)}
                                className='flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium'
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className='flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium'
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPrayersPage;
