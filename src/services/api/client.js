function guessBackendOrigin() {
    if (typeof window === 'undefined') {
        return '';
    }

    const { protocol, hostname } = window.location;
    const host = hostname.startsWith('app.') ? hostname.replace(/^app\./, '') : hostname;
    return `${protocol}//${host}`;
}

function normalizeOrigin(value) {
    if (!value) {
        return '';
    }

    try {
        return new URL(value).origin;
    } catch {
        return value.replace(/\/$/, '');
    }
}

const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_URL || guessBackendOrigin());
const WEB_BASE = `${API_ORIGIN || ''}`; // rotas web: login/logout/register e csrf cookie
const API_BASE = `${API_ORIGIN || ''}/api/v1`; // rotas api
const CSRF_COOKIE_PATH = `${WEB_BASE}/sanctum/csrf-cookie`;
const XSRF_COOKIE_NAME = 'XSRF-TOKEN';

let csrfRequest = null;

function parseCookie(cookieString, name) {
    if (!cookieString) return null;
    const prefix = `${name}=`;
    return cookieString
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))
        ?.slice(prefix.length)
        ?.trim() || null;
}

function isWebPath(path) {
    return (
        path === '/login' ||
        path === '/logout' ||
        path === '/register' ||
        path.startsWith('/login') ||
        path.startsWith('/logout') ||
        path.startsWith('/register')
    );
}

async function ensureCsrfCookie() {
    if (!CSRF_COOKIE_PATH) return;
    if (csrfRequest) {
        return csrfRequest;
    }

    csrfRequest = fetch(CSRF_COOKIE_PATH, {
        method: 'GET',
        credentials: 'include',
    }).then((resp) => {
        if (!resp.ok) {
            throw new Error('Não foi possível sincronizar o token CSRF.');
        }
        return resp;
    }).finally(() => {
        csrfRequest = null;
    });

    return csrfRequest;
}

let authToken = localStorage.getItem('authToken') || null;

export const setAuthToken = (token) => {
    authToken = token || null;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const { headers: customHeaders = {}, signal, ...rest } = options;

    if (method !== 'GET') {
        await ensureCsrfCookie();
    }

    const xsrfToken = parseCookie(typeof document !== 'undefined' ? document.cookie : '', XSRF_COOKIE_NAME);

    const base = isWebPath(path) ? WEB_BASE : API_BASE;
    const authHeader = authToken && !isWebPath(path) ? { Authorization: `Bearer ${authToken}` } : {};

    const resp = await fetch(`${base}${path}`, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...authHeader,
            ...(xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {}),
            ...customHeaders,
        },
        signal,
        ...rest,
    });

    let body = null;
    try {
        body = await resp.json();
    } catch (_) {
        body = null;
    }

    if (!resp.ok) {
        const message = body?.error?.message || body?.message || 'Erro ao chamar API';
        const error = new Error(message);
        error.status = resp.status;
        error.body = body;
        throw error;
    }

    return body;
}

export const get = (path, options = {}) => request(path, { method: 'GET', ...options });
export const post = (path, data, options = {}) =>
    request(path, { method: 'POST', body: JSON.stringify(data || {}), ...options });
export const put = (path, data, options = {}) =>
    request(path, { method: 'PUT', body: JSON.stringify(data || {}), ...options });
export const del = (path, options = {}) => request(path, { method: 'DELETE', ...options });

export default request;
