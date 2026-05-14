const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

document.addEventListener('DOMContentLoaded', async () => {
    applyI18n();

    const { partdbUrl } = await chrome.storage.sync.get({ partdbUrl: '' });

    document.getElementById('open-options').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    document.getElementById('footer-options').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    if (!partdbUrl) {
        show('state-unconfigured');
        return;
    }

    show('state-configured');
    document.getElementById('partdb-url').textContent = stripScheme(partdbUrl);
    document.getElementById('footer-partdb').href = partdbUrl;

    document.getElementById('submit-btn').addEventListener('click', doSubmit);

    await loadProviders();
});

async function loadProviders() {
    const loadingEl = document.getElementById('info-loading');
    const errorEl = document.getElementById('info-error');
    const fieldEl = document.getElementById('provider-field');
    const btn = document.getElementById('submit-btn');

    const result = await chrome.runtime.sendMessage({ action: 'getInfo' });

    loadingEl.classList.add('hidden');

    if (!result.success) {
        if (result.loginUrl) {
            appendLoginLink(errorEl, result.loginUrl);
        } else {
            errorEl.textContent = infoErrorMessage(result);
        }
        errorEl.classList.remove('hidden');
        btn.disabled = false;
        return;
    }

    const { instance_name, username, url_providers } = result.data;

    if (instance_name) {
        const nameEl = document.getElementById('instance-name');
        nameEl.textContent = instance_name;
        nameEl.classList.remove('hidden');
    }
    if (username) {
        const userEl = document.getElementById('instance-user');
        userEl.textContent = username;
        userEl.classList.remove('hidden');
    }

    const providers = url_providers ?? [];

    const select = document.getElementById('provider-select');

    if (providers.length > 0) {
        for (const p of providers) {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.label;
            select.appendChild(opt);
        }
        fieldEl.classList.remove('hidden');
    }

    const { lastProvider } = await chrome.storage.local.get({ lastProvider: '' });
    if ([...select.options].some(o => o.value === lastProvider)) {
        select.value = lastProvider;
    }

    select.addEventListener('change', () => {
        chrome.storage.local.set({ lastProvider: select.value });
    });

    btn.disabled = false;
}

function appendLoginLink(el, loginUrl) {
    el.textContent = chrome.i18n.getMessage('popup_not_logged_in') + ' ';
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = chrome.i18n.getMessage('popup_open_login_page');
    link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: loginUrl });
    });
    el.appendChild(link);
}

function infoErrorMessage(result) {
    switch (result.error) {
        case 'network_error':
            return chrome.i18n.getMessage('popup_error_network', [result.message || 'network error']);
        case 'no_permission':
            return chrome.i18n.getMessage('popup_error_no_permission');
        case 'feature_disabled':
            return chrome.i18n.getMessage('popup_error_feature_disabled');
        case 'http_error':
            return chrome.i18n.getMessage('popup_error_http', [String(result.statusCode)]);
        default:
            return chrome.i18n.getMessage('popup_error_load_providers', [result.error]);
    }
}

async function doSubmit() {
    const btn = document.getElementById('submit-btn');
    const provider = document.getElementById('provider-select')?.value ?? '';
    btn.disabled = true;
    setStatus('loading', chrome.i18n.getMessage('popup_reading_page'));

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        let pageData;
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => ({ html: document.documentElement.outerHTML, url: location.href, title: document.title }),
            });
            pageData = results[0].result;
        } catch {
            setStatus('error', chrome.i18n.getMessage('popup_error_cannot_access'));
            btn.disabled = false;
            return;
        }

        const byteSize = new TextEncoder().encode(pageData.html).length;
        if (byteSize > MAX_HTML_BYTES) {
            setStatus('error', chrome.i18n.getMessage('popup_error_page_too_large', [(byteSize / 1024 / 1024).toFixed(1)]));
            btn.disabled = false;
            return;
        }

        setStatus('loading', chrome.i18n.getMessage('popup_submitting'));

        const result = await chrome.runtime.sendMessage({
            action: 'submit',
            html: pageData.html,
            url: pageData.url,
            title: pageData.title,
            provider: provider || null,
        });

        if (result.success) {
            const msg = provider
                ? chrome.i18n.getMessage('popup_success_provider')
                : chrome.i18n.getMessage('popup_success_stored');
            setStatus('success', msg);
            setTimeout(() => window.close(), 1500);
        } else {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status error';
            statusEl.classList.remove('hidden');
            if (result.loginUrl) {
                appendLoginLink(statusEl, result.loginUrl);
            } else {
                statusEl.textContent = errorMessage(result);
            }
            btn.disabled = false;
        }
    } catch (err) {
        setStatus('error', chrome.i18n.getMessage('popup_error_unexpected', [err.message]));
        btn.disabled = false;
    }
}

function errorMessage(result) {
    switch (result.error) {
        case 'no_config':
            return chrome.i18n.getMessage('popup_error_no_config');
        case 'page_too_large':
            return chrome.i18n.getMessage('popup_error_page_too_large_limit');
        case 'network_error':
            return chrome.i18n.getMessage('popup_error_network', [result.message || 'network error']);
        case 'no_permission':
            return chrome.i18n.getMessage('popup_error_no_permission');
        case 'feature_disabled':
            return chrome.i18n.getMessage('popup_error_feature_disabled');
        case 'http_error':
            return chrome.i18n.getMessage('popup_error_http', [String(result.statusCode)]);
        default:
            return chrome.i18n.getMessage('popup_error_generic', [result.error]);
    }
}

function setStatus(type, text) {
    const el = document.getElementById('status');
    el.textContent = text;
    el.className = `status ${type}`;
    el.classList.remove('hidden');
}

function show(id) {
    document.querySelectorAll('.state').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function stripScheme(url) {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
