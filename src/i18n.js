function applyI18n() {
    for (const el of document.querySelectorAll('[data-i18n]')) {
        const msg = chrome.i18n.getMessage(el.dataset.i18n);
        if (msg) el.textContent = msg;
    }
    for (const el of document.querySelectorAll('[data-i18n-html]')) {
        const msg = chrome.i18n.getMessage(el.dataset.i18nHtml);
        if (msg) {
            const doc = new DOMParser().parseFromString(msg, 'text/html');
            el.replaceChildren(...doc.body.childNodes);
        }
    }
    for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
        const msg = chrome.i18n.getMessage(el.dataset.i18nPlaceholder);
        if (msg) el.placeholder = msg;
    }
}
