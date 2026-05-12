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
});

async function doSubmit() {
    const btn = document.getElementById('submit-btn');
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
        });

        if (result.success) {
            setStatus('success', 'Part creation form opened in a new tab!');
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
