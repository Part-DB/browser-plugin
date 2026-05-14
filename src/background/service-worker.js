chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'submit') {
        handleSubmit(message.html, message.url, message.title, message.provider).then(sendResponse);
        return true;
    }
    if (message.action === 'getInfo') {
        handleGetInfo().then(sendResponse);
        return true;
    }
});

async function getConfig() {
    const { partdbUrl, partdbLocale } = await chrome.storage.sync.get({
        partdbUrl: '',
        partdbLocale: 'en',
    });
    const baseUrl = (partdbUrl || '').replace(/\/$/, '');
    const locale = partdbLocale || 'en';
    return { baseUrl, locale };
}

async function handleGetInfo() {
    const { baseUrl, locale } = await getConfig();
    if (!baseUrl) return { success: false, error: 'no_config' };

    const endpoint = `${baseUrl}/${locale}/tools/info_providers/browser_info`;
    try {
        const response = await fetch(endpoint, { credentials: 'include' });
        if (response.status === 401 || response.status === 403) {
            return { success: false, error: 'not_logged_in' };
        }
        if (!response.ok) {
            return { success: false, error: 'http_error', statusCode: response.status };
        }
        const data = await response.json();
        return { success: true, data };
    } catch (err) {
        return { success: false, error: 'network_error', message: err.message };
    }
}

async function handleSubmit(html, url, title, provider) {
    const { baseUrl, locale } = await getConfig();

    if (!baseUrl) {
        return { success: false, error: 'no_config' };
    }

    const endpoint = `${baseUrl}/${locale}/tools/info_providers/browser_html`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, url, title, provider: provider || null }),
        });

        if (response.status === 401 || response.status === 403) {
            return { success: false, error: 'not_logged_in' };
        }
        if (response.status === 413) {
            return { success: false, error: 'page_too_large' };
        }
        if (!response.ok) {
            return { success: false, error: 'http_error', statusCode: response.status };
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
