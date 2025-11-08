import { supabase } from "./supabase.js";

// Función para forzar sincronización completa
export const forceSync = async () => {
    try {
        const remoteKeys = await listRemoteKeys();
        const localKeys = keys();
        const allKeys = new Set([...remoteKeys, ...localKeys]);

        // Sincronizar todas las claves
        for (const k of allKeys) {
            const fullKey = keyPrefix(k);
            const remoteData = await fetchRemote(fullKey);
            if (remoteData !== null) {
                putLocal(fullKey, remoteData);
            }
        }
        return true;
    } catch (error) {
        console.error('Error en forceSync:', error);
        return false;
    }
};

const NS = "agendasmart:";

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

// Modificar syncFromRemote
export const syncFromRemote = async (force = false) => {
    try {
        const remoteKeys = await listRemoteKeys();
        for (const k of remoteKeys) {
            const full = keyPrefix(k);
            const remoteData = await fetchRemote(full);

            if (remoteData === null) continue;

            const localData = getLocal(full);

            // Si forzamos o no hay datos locales, actualizar
            if (force || localData === null) {
                putLocal(full, remoteData);
            }
            // Aquí podrías agregar lógica de resolución de conflictos
            // por ejemplo, comparar timestamps si los tienes
        }
        return true;
    } catch (error) {
        console.error('Error en syncFromRemote:', error);
        return false;
    }
};

export const getItem = (key) => {
    const k = keyPrefix(key);
    const cached = getLocal(k);
    if (cached != null) return cached;
    fetchRemote(k).then(v => { if (v != null) putLocal(k, v); }).catch(() => { });
    return null;
};

// Modificar setItem para asegurar que los datos se guarden en ambos lados
export const setItem = (key, value) => {
    const k = keyPrefix(key);
    const ok = putLocal(k, value);
    // No esperamos a que termine para no bloquear la UI
    upsertRemote(k, value).catch(console.error);
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
