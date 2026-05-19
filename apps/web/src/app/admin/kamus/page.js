'use client';

import { adminKamusApi } from '@/lib/api';
import { useLocale } from '@/context/Locale';
import { useEffect, useState } from 'react';
import { BsPencil, BsPlusCircle, BsTrash, BsX } from 'react-icons/bs';

const CATEGORIES = ['fiqh', 'aqidah', 'tasawuf', 'ulumul_quran', 'hadith', 'lainnya'];

const EMPTY_FORM = {
    term: '',
    category: 'lainnya',
    definition: '',
    example: '',
    source: '',
    origin: '',
};

const AdminDictionaryPage = () => {
    const { t } = useLocale();
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
            const r = await adminKamusApi.list(0, 500);
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
            term: item.term ?? item.arabic ?? item.latin ?? '',
            category: item.category ?? 'lainnya',
            definition: item.definition ?? item.meaning ?? '',
            example: item.example ?? '',
            source: item.source ?? '',
            origin: item.origin ?? item.root ?? '',
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
                res = await adminKamusApi.update(editId, form);
            } else {
                res = await adminKamusApi.create(form);
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
            const res = await adminKamusApi.delete(deleteId);
            if (!res.ok) throw new Error(t('admin.error.save'));
            setDeleteId(null);
            load();
            fb('admin:success', t('admin.crud.delete_success'));
        } catch (err) {
            fb('admin:mutation-error', err.message);
        }
    };

    const filtered = items.filter(
        (i) => {
            const q = search.toLowerCase();
            return (
                i.term?.toLowerCase().includes(q) ||
                i.definition?.toLowerCase().includes(q) ||
                i.category?.toLowerCase().includes(q) ||
                i.arabic?.includes(search) ||
                i.latin?.toLowerCase().includes(q) ||
                i.meaning?.toLowerCase().includes(q)
            );
        },
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        {t('admin.nav.dictionary')}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} {t('admin.kamus.words_unit')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t('admin.kamus.add_word')}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t('admin.kamus.search_placeholder')}
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
                                    Istilah
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300'>
                                    {t('admin.field.category')}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300'>
                                    Definisi
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                    Asal/Sumber
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
                                        {item.term ?? item.arabic}
                                    </td>
                                    <td className='px-4 py-3 text-gray-700 dark:text-gray-300'>
                                        {item.category ?? '-'}
                                    </td>
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400'>
                                        {item.definition ?? item.meaning}
                                    </td>
                                    <td className='px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden md:table-cell'>
                                        {item.origin || item.source || item.root || '-'}
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
                                        colSpan={5}
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

            {showModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                            <h2 className='font-bold text-gray-900 dark:text-white'>
                                {editId ? t('admin.kamus.edit_word') : t('admin.kamus.add_word')}
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
                                    Istilah
                                </label>
                                <input
                                    type='text'
                                    value={form.term}
                                    onChange={(e) =>
                                        setForm({ ...form, term: e.target.value })
                                    }
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
                                    Definisi
                                </label>
                                <textarea
                                    value={form.definition}
                                    onChange={(e) =>
                                        setForm({ ...form, definition: e.target.value })
                                    }
                                    rows={3}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    Contoh ({t('common.optional')})
                                </label>
                                <textarea
                                    value={form.example}
                                    onChange={(e) =>
                                        setForm({ ...form, example: e.target.value })
                                    }
                                    rows={2}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Asal ({t('common.optional')})
                                    </label>
                                    <input
                                        type='text'
                                        value={form.origin}
                                        onChange={(e) =>
                                            setForm({ ...form, origin: e.target.value })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t('common.source')} ({t('common.optional')})
                                    </label>
                                    <input
                                        type='text'
                                        value={form.source}
                                        onChange={(e) =>
                                            setForm({ ...form, source: e.target.value })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
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
                                disabled={saving || !form.term || !form.definition}
                                className='flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium'
                            >
                                {saving ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'>
                        <h2 className='font-bold text-gray-900 dark:text-white mb-2'>
                            {t('admin.crud.delete_title', { item: t('admin.kamus.word') })}
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

export default AdminDictionaryPage;
