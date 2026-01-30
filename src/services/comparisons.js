import { get, post } from './api/client';

export const fetchComparisonEdit = (id) => get(`/comparisons/${id}/edit`);

export const updateComparison = (id, payload) => post(`/comparisons/${id}?_method=PUT`, payload);

export const createComparison = (payload) => post('/comparisons', payload);

export const listComparisons = (params) => {
    if (!params || Object.keys(params).length === 0) {
        return get('/comparisons');
    }

    const query = new URLSearchParams(params).toString();
    return get(`/comparisons?${query}`);
};

export default {
    fetchComparisonEdit,
    updateComparison,
    createComparison,
    listComparisons,
};
