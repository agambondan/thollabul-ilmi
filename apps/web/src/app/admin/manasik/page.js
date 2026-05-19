'use client';

import { adminManasikApi } from '@/lib/api';
import { useLocale } from '@/context/Locale';
import { getLocalizedField } from '@/lib/translation';
import { useEffect, useState } from 'react';
import { BsPencil, BsPlusCircle, BsTrash, BsX } from 'react-icons/bs';

const TYPES = ['haji', 'umrah'];

const EMPTY_FORM = {
    type: 'haji',
    step: '',
    title: '',
    arabic: '',
    latin: '',
    translation: '',
    description: '',
    notes: '',
    is_wajib: false,
};

const AdminManasikPage = () => {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [filter, setFilter] = useState('haji');
    const [deleteId, setDeleteId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminManasikApi.list(0, 500);
            const data = await r.json();
            const arr = data?.items ?? data ?? [];
            setItems(
                [...arr].sort(
                    (a, b) =>
                        (a.type ?? '').localeCompare(b.type ?? '') ||
                        (a.step ?? 0) - (b.step ?? 0),
                ),
            );
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
        setForm({ ...EMPTY_FORM, type: filter });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditId(item.id ?? item._id);
        setForm({
            type: item.type ?? 'haji',
            step: item.step ?? '',
            title: item.title ?? '',
            arabic: item.arabic ?? '',
            latin: item.latin ?? '',
            translation: item.translation ?? '',
            description: item.description ?? '',
            notes: item.notes ?? '',
            is_wajib: item.is_wajib ?? false,
        });
        setShowModal(true);
    };

    const fb = (type, msg) =>
        window.dispatchEvent(new CustomEvent(type, { detail: { message: msg } }));

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                step: Number(form.step),
                step_order: Number(form.step),
                transliteration: form.latin,
                is_wajib: Boolean(form.is_wajib),
            };
            let res;
            if (editId) {
                res = await adminManasikApi.update(editId, payload);
            } else {
                res = await adminManasikApi.create(payload);
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
            const res = await adminManasikApi.delete(deleteId);
            if (!res.ok) throw new Error(t('admin.error.save'));
            setDeleteId(null);
            load();
            fb('admin:success', t('admin.crud.delete_success'));
        } catch (err) {
            fb('admin:mutation-error', err.message);
        }
    };

    const filtered = items.filter((i) => i.type === filter);

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>{t('admin.nav.manasik')}</h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.filter((i) => i.type === 'haji').length} {t('admin.manasik.hajj_steps')} ·{' '}
                        {items.filter((i) => i.type === 'umrah').length} {t('admin.manasik.umrah_steps')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t('admin.manasik.add_step')}
                </button>
            </div>

            <div className='mb-4 flex gap-2'>
                {TYPES.map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                            filter === t
                                ? 'bg-amber-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className='text-sm text-gray-500'>{t('common.loading')}</p>
            ) : (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-50 dark:bg-slate-700'>
                            <tr>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-16'>
                                    {t('admin.manasik.step')}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300'>
                                    {t('admin.field.title')}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                    {t('admin.field.description')}
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
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs'>
                                        {item.step}
                                    </td>
                                    <td className='px-4 py-3 text-gray-900 dark:text-white font-medium'>
                                        {getLocalizedField(item, 'title', lang)}
                                    </td>
                                    <td className='px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden md:table-cell max-w-xs truncate'>
                                        {getLocalizedField(item, 'description', lang)?.slice(0, 80) ?? '-'}
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
                                        {t('admin.crud.no_data')} {filter}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                            <h2 className='font-bold text-gray-900 dark:text-white'>
                                {editId ? t('admin.manasik.edit_step') : t('admin.manasik.add_step')}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>
                        <div className='p-5 space-y-4'>
                            <div className='grid grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t('admin.manasik.type')}
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={(e) =>
                                            setForm({ ...form, type: e.target.value })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    >
                                        {TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t('admin.manasik.step')}
                                    </label>
                                    <input
                                        type='number'
                                        value={form.step}
                                        onChange={(e) =>
                                            setForm({ ...form, step: e.target.value })
                                        }
                                        min={1}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                                <div className='col-span-1' />
                            </div>
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
                                    {t('admin.field.arabic')} ({t('common.optional')})
                                </label>
                                <textarea
                                    value={form.arabic}
                                    onChange={(e) =>
                                        setForm({ ...form, arabic: e.target.value })
                                    }
                                    rows={2}
                                    dir='rtl'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-arabic text-lg leading-loose'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('admin.field.latin')}
                                </label>
                                <textarea
                                    value={form.latin}
                                    onChange={(e) =>
                                        setForm({ ...form, latin: e.target.value })
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
                                    {t('admin.field.description')}
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                    rows={3}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t('common.notes')}
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({ ...form, notes: e.target.value })
                                    }
                                    rows={2}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <label className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                                <input
                                    type='checkbox'
                                    checked={form.is_wajib}
                                    onChange={(e) =>
                                        setForm({ ...form, is_wajib: e.target.checked })
                                    }
                                    className='rounded border-gray-300 dark:border-slate-600 text-emerald-700 focus:ring-emerald-500'
                                />
                                Wajib
                            </label>
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

            {deleteId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'>
                        <h2 className='font-bold text-gray-900 dark:text-white mb-2'>
                            {t('admin.crud.delete_title').replace('{item}', t('admin.manasik.step'))}
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

export default AdminManasikPage;
