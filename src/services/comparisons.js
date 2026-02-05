import { get, post, del } from './api/client';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const defaultHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

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

export const fetchComparisonPresentationLink = async (id) => {
    const resp = await fetch(`${API_ORIGIN}/api/comparisons/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: defaultHeaders(),
    });

    const body = await resp.json();
    if (!resp.ok) {
        const message = body?.message || 'Erro ao carregar link de apresentação';
        throw new Error(message);
    }

    return body?.data?.links?.presentation || body?.links?.presentation || null;
};

export const deleteComparison = (id) => {
    return del(`/comparisons/${id}`);
};

const unwrapApiResponse = (body) => {
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
        return body.data;
    }
    return body;
};

export const generateComparisonPdf = async (id, payload = {}, options = {}) => {
    const body = await post(`/comparisons/${id}/pdf`, payload, options);
    return unwrapApiResponse(body);
};

export const fetchComparisonPdf = async (id, options = {}) => {
    const body = await get(`/comparisons/${id}/pdf`, options);
    return unwrapApiResponse(body);
};

export const sendComparisonPdfEmail = async (id, payload) => {
    const body = await post(`/comparisons/${id}/pdf/email`, payload);
    return unwrapApiResponse(body);
};

export default {
    fetchComparisonEdit,
    updateComparison,
    createComparison,
    listComparisons,
    fetchComparisonPresentationLink,
    deleteComparison,
    generateComparisonPdf,
    fetchComparisonPdf,
    sendComparisonPdfEmail,
};
