function browserLocaleCode() {
    return chrome.i18n.getUILanguage().split(/[-_]/)[0].toLowerCase();
}

document.addEventListener('DOMContentLoaded', async () => {
    applyI18n();

    const suggestedLocale = browserLocaleCode();

    const { partdbUrl, partdbLocale } = await chrome.storage.sync.get({
        partdbUrl: '',
        partdbLocale: suggestedLocale,
    });

    document.getElementById('partdb-url').value = partdbUrl;
    document.getElementById('partdb-locale').value = partdbLocale;

    const suggestionEl = document.getElementById('locale-suggestion');
    if (suggestionEl) {
        suggestionEl.textContent = chrome.i18n.getMessage('options_locale_suggestion', [suggestedLocale]);
        const useLink = document.getElementById('locale-use-suggestion');
        if (useLink) {
            useLink.textContent = chrome.i18n.getMessage('options_locale_use_suggestion');
            useLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('partdb-locale').value = suggestedLocale;
            });
        }
    }

    document.getElementById('settings-form').addEventListener('submit', saveSettings);
    document.getElementById('test-btn').addEventListener('click', testConnection);
});

async function requestHostPermission(url) {
    let origin;
    try {
        origin = new URL(url).origin + '/*';
    } catch {
        return { ok: false, error: chrome.i18n.getMessage('options_error_invalid_url') };
    }
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (!granted) {
        return { ok: false, error: chrome.i18n.getMessage('options_error_permission_denied') };
    }
    return { ok: true };
}

async function saveSettings(e) {
    e.preventDefault();

    const url = document.getElementById('partdb-url').value.trim().replace(/\/$/, '');
    const locale = document.getElementById('partdb-locale').value.trim() || 'en';

    if (url) {
        const perm = await requestHostPermission(url);
        if (!perm.ok) {
            const status = document.getElementById('save-status');
            status.textContent = perm.error;
            status.className = 'save-status error';
            status.classList.remove('hidden');
            setTimeout(() => status.classList.add('hidden'), 6000);
            return;
        }
    }

    await chrome.storage.sync.set({ partdbUrl: url, partdbLocale: locale });

    const status = document.getElementById('save-status');
    status.textContent = chrome.i18n.getMessage('options_saved');
    status.className = 'save-status success';
    status.classList.remove('hidden');

    setTimeout(() => status.classList.add('hidden'), 3000);
}

async function testConnection() {
    const url = document.getElementById('partdb-url').value.trim().replace(/\/$/, '');
    const locale = document.getElementById('partdb-locale').value.trim() || 'en';

    if (!url) {
        showTestResult('error', chrome.i18n.getMessage('options_error_no_url'));
        return;
    }

    const perm = await requestHostPermission(url);
    if (!perm.ok) {
        showTestResult('error', perm.error);
        return;
    }

    const resultEl = document.getElementById('test-result');
    resultEl.className = 'test-result loading';
    resultEl.textContent = chrome.i18n.getMessage('options_testing');
    resultEl.classList.remove('hidden');

    try {
        const endpoint = `${url}/${locale}/tools/info_providers/browser_html`;
        // OPTIONS preflight check — we expect a 405 (method not allowed) or 401/403, not a network error
        const response = await fetch(endpoint, {
            method: 'OPTIONS',
            credentials: 'include',
        });

        if (response.ok || response.status === 405 || response.status === 401 || response.status === 403) {
            if (response.status === 401 || response.status === 403) {
                showTestResult('error', chrome.i18n.getMessage('options_error_not_logged_in', [String(response.status)]));
            } else {
                showTestResult('success', chrome.i18n.getMessage('options_success_connection', [url]));
            }
        } else {
            showTestResult('error', chrome.i18n.getMessage('options_error_unexpected_response', [String(response.status)]));
        }
    } catch (err) {
        showTestResult('error', chrome.i18n.getMessage('options_error_cannot_reach', [err.message]));
    }
}

function showTestResult(type, message) {
    const el = document.getElementById('test-result');
    el.textContent = message;
    el.className = `test-result ${type}`;
    el.classList.remove('hidden');
}
