// Extract the list of allowed domains from availableSources
const allowedDomains = availableSources.flatMap(source => {
    return Object.values(source.urls).map(url => {
        const domainMatch = url.match(/^https?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        return domainMatch ? domainMatch[1] : null;
    }).filter(Boolean);
});

// Intercept all window.open (popup/redirect attempts)
const originalOpen = window.open;
window.open = function (url, ...args) {
    const domain = new URL(url).hostname;
    if (allowedDomains.includes(domain)) {
        return originalOpen.call(window, url, ...args);
    } else {
        console.warn(`Blocked popup to disallowed domain: ${domain}`);
        return null;
    }
};

// Intercept iframe embeds and resource loads
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'IFRAME' || node.tagName === 'SCRIPT') {
                try {
                    const src = node.src || '';
                    const domain = new URL(src).hostname;
                    if (!allowedDomains.includes(domain)) {
                        console.warn(`Blocked ${node.tagName.toLowerCase()} from disallowed domain: ${domain}`);
                        node.remove();
                    }
                } catch (e) {
                    // Invalid URL or local src
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });
