const normalizeBaseUrl = (value) => {
    const fallback = 'http://localhost:3001';
    const isProduction = import.meta.env.PROD;
    const hasConfiguredValue = typeof value === 'string' && value.trim();

    if (!hasConfiguredValue) {
        return isProduction ? '' : fallback;
    }

    return value.trim().replace(/\/+$/, '');
};

const SESSION_SERVER_BASE_URL = normalizeBaseUrl(
    import.meta.env.VITE_LINUX_FORMATION_SERVER_URL,
);

const getMissingServerUrlMessage = () => (
    'Le serveur de session n\'est pas configure. Definis VITE_LINUX_FORMATION_SERVER_URL dans le .env du front.'
);

const buildHeaders = ({ token = '', adminPassword = '', hasBody = false } = {}) => {
    const headers = {};

    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (adminPassword) {
        headers['X-Admin-Password'] = adminPassword;
    }

    return headers;
};

const request = async (path, options = {}) => {
    if (!SESSION_SERVER_BASE_URL) {
        throw new Error(getMissingServerUrlMessage());
    }

    const response = await fetch(`${SESSION_SERVER_BASE_URL}${path}`, options);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Request failed with status ${response.status}`);
    }

    return payload;
};

export const getSessionServerBaseUrl = () => (
    SESSION_SERVER_BASE_URL || 'non configure'
);

export const sessionClient = {
    async verifyAdminAccess(adminPassword) {
        return request('/api/admin/access', {
            method: 'POST',
            headers: buildHeaders({ adminPassword, hasBody: true }),
            body: JSON.stringify({}),
        });
    },

    async createSession(label, adminPassword) {
        return request('/api/admin/sessions', {
            method: 'POST',
            headers: buildHeaders({ adminPassword, hasBody: true }),
            body: JSON.stringify({ label }),
        });
    },

    async getAdminSessions(adminPassword) {
        return request('/api/admin/sessions', {
            method: 'GET',
            headers: buildHeaders({ adminPassword, hasBody: false }),
        });
    },

    async joinSession(sessionCode, participant) {
        return request(`/api/sessions/${encodeURIComponent(sessionCode)}/join`, {
            method: 'POST',
            headers: buildHeaders({ hasBody: true }),
            body: JSON.stringify(participant),
        });
    },

    async sendEvents(sessionCode, participantToken, events) {
        return request(`/api/sessions/${encodeURIComponent(sessionCode)}/events/batch`, {
            method: 'POST',
            headers: buildHeaders({ token: participantToken, hasBody: true }),
            body: JSON.stringify({ events }),
        });
    },

    async getAdminSessionSnapshot(sessionCode, adminToken, adminPassword) {
        return request(`/api/admin/sessions/${encodeURIComponent(sessionCode)}/participants`, {
            method: 'GET',
            headers: buildHeaders({ token: adminToken, adminPassword, hasBody: false }),
        });
    },

    async closeSession(sessionCode, adminToken, adminPassword) {
        return request(`/api/admin/sessions/${encodeURIComponent(sessionCode)}/close`, {
            method: 'POST',
            headers: buildHeaders({ token: adminToken, adminPassword, hasBody: false }),
        });
    },
};
