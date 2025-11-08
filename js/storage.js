import { supabase } from "./supabase.js";

const NS = "agendasmart:";

export const clearAppData = () => {
    try {
        // Usamos Object.keys para evitar problemas de índice al eliminar
        Object.keys(localStorage)
            .filter(key => key.startsWith(NS))
            .forEach(key => localStorage.removeItem(key));
        return true;
    } catch (error) {
        console.error('Error al limpiar datos locales:', error);
        return false;
    }
};

const keyPrefix = (k) => NS + k;
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const toJson = (v) => { try { return JSON.stringify(v); } catch { return null; } };
const putLocal = (k, v) => { try { const j = toJson(v); if (j != null) localStorage.setItem(k, j); return true; } catch { return false; } };
const getLocal = (k) => { try { const r = localStorage.getItem(k); return r == null ? null : parseJson(r); } catch { return null; } };
const removeLocal = (k) => { try { localStorage.removeItem(k); return true; } catch { return false; } };
const upsertRemote = async (k, v) => { try { const { error } = await supabase.from("kv").upsert({ key: k, value: v }); return !error; } catch { return false; } };
const deleteRemote = async (k) => { try { const { error } = await supabase.from("kv").delete().eq("key", k); return !error; } catch { return false; } };
const fetchRemote = async (k) => { try { const { data, error } = await supabase.from("kv").select("value").eq("key", k).maybeSingle(); if (error) return null; return data ? data.value : null; } catch { return null; } };
const listRemoteKeys = async () => { try { const { data, error } = await supabase.from("kv").select("key"); if (error) return []; return (data || []).map(x => x.key).filter(k => typeof k === "string" && k.startsWith(NS)).map(k => k.substring(NS.length)); } catch { return []; } };

export const syncFromRemote = async () => {
    const remoteKeys = await listRemoteKeys();
    for (const k of remoteKeys) {
        const full = keyPrefix(k);
        const current = getLocal(full);
        if (current == null) {
            const v = await fetchRemote(full);
            if (v != null) putLocal(full, v);
        }
    }
};

export const getItem = (key) => {
    const k = keyPrefix(key);
    const cached = getLocal(k);
    if (cached != null) return cached;
    fetchRemote(k).then(v => { if (v != null) putLocal(k, v); }).catch(() => {});
    return null;
};

export const setItem = (key, value) => {
    const k = keyPrefix(key);
    const ok = putLocal(k, value);
    upsertRemote(k, value);
    return ok;
};

export const removeItem = (key) => {
    const k = keyPrefix(key);
    const ok = removeLocal(k);
    deleteRemote(k);
    return ok;
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
