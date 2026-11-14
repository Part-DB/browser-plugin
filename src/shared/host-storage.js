const DEFAULT_LOCALE = 'en';

function generateHostId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'host-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function hostLabelFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

async function migrateLegacyHostConfig() {
    const { partdbUrl } = await chrome.storage.sync.get({ partdbUrl: '' });
    if (!partdbUrl) {
        await chrome.storage.sync.set({ hosts: [] });
        return [];
    }

    const { partdbLocale } = await chrome.storage.sync.get({ partdbLocale: DEFAULT_LOCALE });
    const id = generateHostId();
    const hosts = [{
        id,
        name: hostLabelFromUrl(partdbUrl),
        url: partdbUrl.replace(/\/$/, ''),
        locale: partdbLocale || DEFAULT_LOCALE,
    }];

    await chrome.storage.sync.set({ hosts });
    await chrome.storage.sync.remove(['partdbUrl', 'partdbLocale']);
    await chrome.storage.local.set({ lastHostId: id });

    return hosts;
}

async function getHosts() {
    const { hosts } = await chrome.storage.sync.get({ hosts: null });
    if (hosts === null) {
        return migrateLegacyHostConfig();
    }
    return hosts;
}

async function saveHosts(hosts) {
    await chrome.storage.sync.set({ hosts });
}

async function getHostById(id) {
    const hosts = await getHosts();
    return hosts.find((h) => h.id === id) || null;
}

async function getLastHostId() {
    const { lastHostId } = await chrome.storage.local.get({ lastHostId: '' });
    return lastHostId;
}

async function setLastHostId(id) {
    await chrome.storage.local.set({ lastHostId: id });
}

/**
 * Builds the host permission match pattern for a Part-DB base URL.
 *
 * The port is deliberately left out: Firefox does not support ports in match patterns, so a pattern like
 * "http://192.168.1.10:8080/*" never matches any request there, and fetches to Part-DB instances on
 * non-standard ports fail with "NetworkError when attempting to fetch resource".
 * A pattern without a port matches every port of that host in both Chrome and Firefox.
 */
function hostPermissionPattern(url) {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/*`;
}

async function hasHostPermission(url) {
    try {
        return await chrome.permissions.contains({ origins: [hostPermissionPattern(url)] });
    } catch {
        return false;
    }
}
