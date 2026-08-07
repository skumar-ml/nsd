/*
Purpose: Shared Memberstack auth helpers for NSD CDN scripts.

Brief Logic: Obtains the logged-in member's JWT (via the Webflow-header
getAuthToken() helper, or MemberStack.getToken() fallback) and attaches it as
Authorization: Bearer <token> on fetch / XHR calls to protected backend APIs.

Load this script site-wide in Webflow BEFORE feature scripts that call AWS APIs.
Depends on the Header custom-code getAuthToken() (or Memberstack 1.0 client).

Are there any dependent JS files: No (exposes window.NSDAuth)
*/
;(function (global) {
    /**
     * Resolve the current Memberstack 1.0 member JWT.
     * Prefers the site-header getAuthToken(); falls back to MemberStack directly.
     * @returns {Promise<string>}
     */
    async function getToken() {
        // Webflow Header custom code defines getAuthToken() globally.
        if (typeof global.getAuthToken === "function") {
            const token = await global.getAuthToken()
            if (token) return token
        }

        // Fallback when the header helper is missing but Memberstack is loaded.
        if (global.MemberStack) {
            await global.MemberStack.onReady
            const token = await global.MemberStack.getToken()
            if (token) return token
        }

        throw new Error(
            "NSDAuth: no Memberstack token available (is the member logged in?)",
        )
    }

    /**
     * Build request headers including Authorization: Bearer <token>.
     * @param {HeadersInit} [extra] - Additional headers to merge (e.g. Content-Type).
     * @returns {Promise<Record<string, string>>}
     */
    async function authHeaders(extra) {
        const token = await getToken()
        const headers = Object.assign({}, extra || {})
        headers.Authorization = "Bearer " + token
        return headers
    }

    /**
     * fetch() wrapper that always sends the Memberstack bearer token.
     * Use for every protected NSD API call (portal, payment, forms, attendance, auth).
     * @param {RequestInfo|URL} url
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     */
    async function authFetch(url, options) {
        const opts = Object.assign({}, options || {})
        // Normalize Headers / plain object into a plain object we can augment.
        const extra = {}
        if (opts.headers) {
            if (typeof Headers !== "undefined" && opts.headers instanceof Headers) {
                opts.headers.forEach(function (value, key) {
                    extra[key] = value
                })
            } else {
                Object.assign(extra, opts.headers)
            }
        }
        opts.headers = await authHeaders(extra)
        return fetch(url, opts)
    }

    /**
     * Attach Authorization to an already-opened XMLHttpRequest (before send()).
     * @param {XMLHttpRequest} xhr
     * @returns {Promise<XMLHttpRequest>}
     */
    async function authorizeXhr(xhr) {
        const token = await getToken()
        xhr.setRequestHeader("Authorization", "Bearer " + token)
        return xhr
    }

    global.NSDAuth = {
        getToken: getToken,
        authHeaders: authHeaders,
        authFetch: authFetch,
        authorizeXhr: authorizeXhr,
    }
})(typeof window !== "undefined" ? window : this)
