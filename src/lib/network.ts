/**
 * Utility to check if a URL points to a local network endpoint.
 * This is used to allow HTTP (instead of HTTPS) and skip API key requirements.
 */
export function isLocalEndpoint(url: string | URL): boolean {
    try {
        const parsed = typeof url === 'string' ? new URL(url) : url;
        const host = parsed.hostname.toLowerCase();

        // 1. Localhost and Loopback
        if (['localhost', '127.0.0.1', '::1'].includes(host)) {
            return true;
        }

        // 2. mDNS (e.g., ollama.local)
        if (host.endsWith('.local')) {
            return true;
        }

        // 3. RFC 1918 Private IP Ranges
        // 10.0.0.0 – 10.255.255.255
        if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
            return true;
        }
        // 172.16.0.0 – 172.31.255.255
        if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) {
            return true;
        }
        // 192.168.0.0 – 192.168.255.255
        if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
            return true;
        }

        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Specifically checks if the hostname is an IP address.
 * Used to determine if dynamic permissions are required.
 */
export function isIPAddress(url: string | URL): boolean {
    try {
        const parsed = typeof url === 'string' ? new URL(url) : url;
        const host = parsed.hostname.toLowerCase();

        // IPv4 pattern
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
        // IPv6 pattern (simplified)
        if (host.includes(':')) return true;

        return false;
    } catch (e) {
        return false;
    }
}
