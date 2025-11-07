const NS = "agendasmart:";

export const getItem = (key) => {
    try {
        const raw = localStorage.getItem(NS + key);
        if (raw == null) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const setItem = (key, value) => {
    try {
        localStorage.setItem(NS + key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

export const removeItem = (key) => {
    try {
        localStorage.removeItem(NS + key);
        return true;
    } catch {
        return false;
    }
};

export const keys = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(NS)) out.push(k.substring(NS.length));
    }
    return out;
};
