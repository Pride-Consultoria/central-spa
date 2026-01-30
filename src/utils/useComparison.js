import { useState, useCallback, useEffect } from 'react';
import { fetchComparisonEdit, updateComparison } from '../services/comparisons';

export default function useComparison(id) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetchComparisonEdit(id);
            setData(res.data);
        } catch (err) {
            setError(err.message || 'Erro ao carregar');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const save = useCallback(
        async (payload, { silent = false } = {}) => {
            if (!id) return;
            if (!silent) setSaving(true);
            setError(null);
            try {
                await updateComparison(id, payload);
            } catch (err) {
                setError(err.message || 'Erro ao salvar');
                throw err;
            } finally {
                if (!silent) setSaving(false);
            }
        },
        [id],
    );

    useEffect(() => {
        load();
    }, [load]);

    return {
        data,
        loading,
        error,
        saving,
        setData,
        load,
        save,
        setError,
    };
}
