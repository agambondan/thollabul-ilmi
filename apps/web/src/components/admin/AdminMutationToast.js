'use client';

import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const AdminMutationToast = () => {
    useEffect(() => {
        const handleError = (event) => {
            toast.error(event.detail?.message ?? 'Aksi admin gagal diproses.', {
                duration: 4500,
            });
        };

        const handleSuccess = (event) => {
            toast.success(event.detail?.message ?? 'Data berhasil diproses.', {
                duration: 3500,
            });
        };

        window.addEventListener('admin:mutation-error', handleError);
        window.addEventListener('admin:success', handleSuccess);

        return () => {
            window.removeEventListener('admin:mutation-error', handleError);
            window.removeEventListener('admin:success', handleSuccess);
        };
    }, []);

    return <Toaster position='top-right' />;
};

export default AdminMutationToast;
