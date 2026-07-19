if (typeof importScripts === 'function') {
    importScripts('../shared/host-storage.js');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'submit') {
        handleSubmit(message.hostId, message.html, message.url, message.title, message.provider).then(sendResponse);
        return true;
    }
    if (message.action === 'getInfo') {
        handleGetInfo(message.hostId).then(sendResponse);
        return true;
    }
});

const INFO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function handleGetInfo(hostId) {
    const host = await getHostById(hostId);
    if (!host) return { success: false, error: 'no_config' };

    const baseUrl = host.url;
    const locale = host.locale || 'en';

    const { infoCacheByHost } = await chrome.storage.local.get({ infoCacheByHost: {} });
    const cached = infoCacheByHost[hostId];
    if (cached && cached.baseUrl === baseUrl && Date.now() - cached.ts < INFO_CACHE_TTL) {
        return { success: true, data: cached.data };
    }

    const endpoint = `${baseUrl}/${locale}/tools/info_providers/browser_info`;
    try {
        const response = await fetch(endpoint, { credentials: 'include' });
        if (response.status === 401) {
            return { success: false, error: 'not_logged_in', loginUrl: `${baseUrl}/${locale}/login` };
        }
        if (response.status === 403) {
            return { success: false, error: 'no_permission' };
        }
        if (response.status === 451) {
            return { success: false, error: 'feature_disabled' };
        }
        if (!response.ok) {
            return { success: false, error: 'http_error', statusCode: response.status };
        }
        if (!response.headers.get('content-type')?.includes('application/json')) {
            return { success: false, error: 'not_logged_in', loginUrl: `${baseUrl}/${locale}/login` };
        }
        const data = await response.json();
        infoCacheByHost[hostId] = { baseUrl, data, ts: Date.now() };
        await chrome.storage.local.set({ infoCacheByHost });
        return { success: true, data };
    } catch (err) {
        return { success: false, error: 'network_error', message: err.message };
    }
}

async function handleSubmit(hostId, html, url, title, provider) {
    const host = await getHostById(hostId);
    if (!host) {
        return { success: false, error: 'no_config' };
    }

    const baseUrl = host.url;
    const locale = host.locale || 'en';

    const endpoint = `${baseUrl}/${locale}/tools/info_providers/browser_html`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, url, title, provider: provider || null }),
        });

        if (response.status === 401) {
            return { success: false, error: 'not_logged_in', loginUrl: `${baseUrl}/${locale}/login` };
        }
        if (response.status === 403) {
            return { success: false, error: 'no_permission' };
        }
        if (response.status === 451) {
            return { success: false, error: 'feature_disabled' };
        }
        if (response.status === 413) {
            return { success: false, error: 'page_too_large' };
        }
        if (!response.ok) {
            return { success: false, error: 'http_error', statusCode: response.status };
        }

        if (!response.headers.get('content-type')?.includes('application/json')) {
            return { success: false, error: 'not_logged_in', loginUrl: `${baseUrl}/${locale}/login` };
        }
        const data = await response.json();
        if (provider && data.redirect_url) {
            await chrome.tabs.create({ url: data.redirect_url });
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: 'network_error', message: err.message };
    }
}
