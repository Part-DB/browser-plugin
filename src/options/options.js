function browserLocaleCode() {
    return chrome.i18n.getUILanguage().split(/[-_]/)[0].toLowerCase();
}

const suggestedLocale = browserLocaleCode();

document.addEventListener('DOMContentLoaded', async () => {
    applyI18n();

    const hosts = await getHosts();
    for (const host of hosts) {
        addHostRow(host);
    }
    updateEmptyHint();

    document.getElementById('add-host-btn').addEventListener('click', () => {
        addHostRow({ id: generateHostId(), name: '', url: '', locale: suggestedLocale }, { focus: true });
        updateEmptyHint();
    });

    document.getElementById('save-btn').addEventListener('click', saveAllSettings);
});

function updateEmptyHint() {
    const hint = document.getElementById('no-hosts-hint');
    const list = document.getElementById('hosts-list');
    hint.classList.toggle('hidden', list.children.length > 0);
}

function addHostRow(host, { focus = false } = {}) {
    const template = document.getElementById('host-row-template');
    const fragment = template.content.cloneNode(true);
    const rowEl = fragment.querySelector('.host-row');

    applyI18n(rowEl);

    rowEl.dataset.id = host.id;
    rowEl.querySelector('.host-name').value = host.name || '';
    rowEl.querySelector('.host-url').value = host.url || '';
    rowEl.querySelector('.host-locale').value = host.locale || '';

    const suggestionEl = rowEl.querySelector('.locale-suggestion');
    suggestionEl.textContent = chrome.i18n.getMessage('options_locale_suggestion', [suggestedLocale]);
    const useLink = rowEl.querySelector('.locale-use-suggestion');
    useLink.textContent = chrome.i18n.getMessage('options_locale_use_suggestion');
    useLink.addEventListener('click', (e) => {
        e.preventDefault();
        rowEl.querySelector('.host-locale').value = suggestedLocale;
    });

    rowEl.querySelector('.host-remove').addEventListener('click', () => {
        rowEl.remove();
        updateEmptyHint();
    });

    rowEl.querySelector('.host-test').addEventListener('click', () => testHostRow(rowEl));

    document.getElementById('hosts-list').appendChild(rowEl);

    if (focus) {
        rowEl.querySelector('.host-name').focus();
    }

    return rowEl;
}

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

function readHostRow(rowEl) {
    const url = rowEl.querySelector('.host-url').value.trim().replace(/\/$/, '');
    const name = rowEl.querySelector('.host-name').value.trim();
    const locale = rowEl.querySelector('.host-locale').value.trim() || 'en';
    return { id: rowEl.dataset.id, name, url, locale };
}

function showRowTestResult(rowEl, type, message) {
    const el = rowEl.querySelector('.host-test-result');
    el.textContent = message;
    el.className = `test-result host-test-result ${type}`;
    el.classList.remove('hidden');
}

async function testHostRow(rowEl) {
    const { url, locale } = readHostRow(rowEl);

    if (!url) {
        showRowTestResult(rowEl, 'error', chrome.i18n.getMessage('options_error_no_url'));
        return;
    }

    const perm = await requestHostPermission(url);
    if (!perm.ok) {
        showRowTestResult(rowEl, 'error', perm.error);
        return;
    }

    showRowTestResult(rowEl, 'loading', chrome.i18n.getMessage('options_testing'));

    try {
        const endpoint = `${url}/${locale}/tools/info_providers/browser_html`;
        // OPTIONS preflight check — we expect a 405 (method not allowed) or 401/403, not a network error
        const response = await fetch(endpoint, {
            method: 'OPTIONS',
            credentials: 'include',
        });

        if (response.ok || response.status === 405 || response.status === 401 || response.status === 403) {
            if (response.status === 401 || response.status === 403) {
                showRowTestResult(rowEl, 'error', chrome.i18n.getMessage('options_error_not_logged_in', [String(response.status)]));
            } else {
                showRowTestResult(rowEl, 'success', chrome.i18n.getMessage('options_success_connection', [url]));
            }
        } else {
            showRowTestResult(rowEl, 'error', chrome.i18n.getMessage('options_error_unexpected_response', [String(response.status)]));
        }
    } catch (err) {
        showRowTestResult(rowEl, 'error', chrome.i18n.getMessage('options_error_cannot_reach', [err.message]));
    }
}

function showSaveStatus(type, message) {
    const status = document.getElementById('save-status');
    status.textContent = message;
    status.className = `save-status ${type}`;
    status.classList.remove('hidden');
    setTimeout(() => status.classList.add('hidden'), type === 'error' ? 6000 : 3000);
}

async function saveAllSettings() {
    const rows = [...document.querySelectorAll('.host-row')];
    const newHosts = [];

    for (const rowEl of rows) {
        const host = readHostRow(rowEl);
        if (!host.url) {
            showSaveStatus('error', chrome.i18n.getMessage('options_error_no_url'));
            rowEl.querySelector('.host-url').focus();
            return;
        }
        if (!host.name) {
            host.name = hostLabelFromUrl(host.url);
        }
        newHosts.push(host);
    }

    for (const host of newHosts) {
        const perm = await requestHostPermission(host.url);
        if (!perm.ok) {
            showSaveStatus('error', perm.error);
            return;
        }
    }

    await saveHosts(newHosts);

    document.getElementById('hosts-list').innerHTML = '';
    for (const host of newHosts) {
        addHostRow(host);
    }
    updateEmptyHint();

    showSaveStatus('success', chrome.i18n.getMessage('options_saved'));
}
