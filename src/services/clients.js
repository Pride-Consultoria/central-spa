import { get, post, put, del } from './api/client';

const buildQuery = (params = {}) => {
    const merged = { only_clients: 1, ...params };
    const query = Object.keys(merged)
        .filter((key) => merged[key] !== undefined && merged[key] !== null)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(merged[key])}`)
        .join('&');
    return query ? `?${query}` : '';
};

export const listClients = (params = {}) => get(`/clients${buildQuery(params)}`);
export const createClient = (payload) => post('/clients', payload);
export const updateClient = (id, payload) => put(`/clients/${id}`, payload);
export const deleteClient = (id) => del(`/clients/${id}`);

const clientService = {
    listClients,
    createClient,
    updateClient,
    deleteClient,
};

export default clientService;
