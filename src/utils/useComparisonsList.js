import { useState, useRef, useCallback, useEffect } from 'react';
import { listComparisons } from '../services/comparisons';

export default function useComparisonsList(initialSearch = '') {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    const fetchData = useCallback(
        async (params = {}) => {
            setLoading(true);
            setError(null);
            try {
                const res = await listComparisons(params);
                setData(res.data || []);
            } catch (err) {
                setError(err.message || 'Erro ao carregar');
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const debounceSearch = useCallback(
        (val) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                fetchData({ search: val });
            }, 300);
        },
        [fetchData],
    );

    useEffect(() => {
        fetchData(initialSearch ? { search: initialSearch } : {});
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [initialSearch, fetchData]);

    return {
        data,
        loading,
        error,
        fetchData,
        debounceSearch,
        setData,
    };
}
