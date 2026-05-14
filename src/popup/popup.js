const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5 MB

document.addEventListener('DOMContentLoaded', async () => {
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
        errorEl.textContent = infoErrorMessage(result);
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

    if (providers.length > 0) {
        const select = document.getElementById('provider-select');
        for (const p of providers) {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.label;
            select.appendChild(opt);
        }
        fieldEl.classList.remove('hidden');
    }

    btn.disabled = false;
}

function infoErrorMessage(result) {
    switch (result.error) {
        case 'not_logged_in':
            return 'Not logged into Part-DB. Log in first, then reopen this popup.';
        case 'network_error':
            return `Could not reach Part-DB: ${result.message || 'network error'}`;
        case 'http_error':
            return `Part-DB returned HTTP ${result.statusCode}.`;
        default:
            return `Could not load providers (${result.error}).`;
    }
}

async function doSubmit() {
    const btn = document.getElementById('submit-btn');
    const provider = document.getElementById('provider-select')?.value ?? '';
    btn.disabled = true;
    setStatus('loading', 'Reading page…');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        let pageData;
        try {
            pageData = await chrome.tabs.sendMessage(tab.id, { action: 'getHTML' });
        } catch {
            setStatus('error', 'Cannot access this page. Try refreshing it.');
            btn.disabled = false;
            return;
        }

        const byteSize = new TextEncoder().encode(pageData.html).length;
        if (byteSize > MAX_HTML_BYTES) {
            setStatus('error', `Page is too large (${(byteSize / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
            btn.disabled = false;
            return;
        }

        setStatus('loading', 'Submitting to Part-DB…');

        const result = await chrome.runtime.sendMessage({
            action: 'submit',
            html: pageData.html,
            url: pageData.url,
            title: pageData.title,
            provider: provider || null,
        });

        if (result.success) {
            const msg = provider
                ? 'Part creation form opened in a new tab!'
                : 'Page stored in Part-DB.';
            setStatus('success', msg);
            setTimeout(() => window.close(), 1500);
        } else {
            setStatus('error', errorMessage(result));
            btn.disabled = false;
        }
    } catch (err) {
        setStatus('error', `Unexpected error: ${err.message}`);
        btn.disabled = false;
    }
}

function errorMessage(result) {
    switch (result.error) {
        case 'no_config':
            return 'Part-DB URL is not configured. Open Settings.';
        case 'not_logged_in':
            return 'Not logged into Part-DB. Please log in first, then try again.';
        case 'page_too_large':
            return 'Page HTML exceeds the 5 MB limit.';
        case 'network_error':
            return `Could not reach Part-DB: ${result.message || 'network error'}`;
        case 'http_error':
            return `Part-DB returned HTTP ${result.statusCode}.`;
        default:
            return `Error: ${result.error}`;
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
