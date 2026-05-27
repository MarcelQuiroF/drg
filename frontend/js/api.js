export const API_URL = '/api/v1';

export function getToken() {
    return localStorage.getItem('token_drg');
}

export async function authFetch(endpoint, options = {}) {
    const token = getToken();
    
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem('token_drg');
        window.location.href = 'login.html';
        return;
    }

    return response;
}