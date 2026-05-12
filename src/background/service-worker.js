chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'submit') {
        handleSubmit(message.html, message.url, message.title).then(sendResponse);
        return true; // keep message channel open for async response
    }
});

async function handleSubmit(html, url, title) {
    const { partdbUrl, partdbLocale } = await chrome.storage.sync.get({
        partdbUrl: '',
        partdbLocale: 'en',
    });

    if (!partdbUrl) {
        return { success: false, error: 'no_config' };
    }

    const baseUrl = partdbUrl.replace(/\/$/, '');
    const locale = partdbLocale || 'en';
    const endpoint = `${baseUrl}/${locale}/tools/info_providers/browser_html`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, url, title }),
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
        await chrome.tabs.create({ url: data.redirect_url });
        return { success: true };
    } catch (err) {
        return { success: false, error: 'network_error', message: err.message };
    }
}
