import { supabase } from "./supabase.js";

// Función para forzar sincronización completa con validación
export const forceSync = async () => {
    try {
        console.log('🔄 Iniciando sincronización forzada...');
        const remoteKeys = await listRemoteKeys();
        const localKeys = keys();
        const allKeys = new Set([...remoteKeys, ...localKeys]);

        let syncCount = 0;
        for (const k of allKeys) {
            const fullKey = keyPrefix(k);
            try {
                const remoteData = await fetchRemote(fullKey);
                const localData = getLocal(fullKey);
                
                // Validar datos remotos antes de sobrescribir
                if (remoteData !== null && isValidData(remoteData, k)) {
                    putLocal(fullKey, remoteData);
                    syncCount++;
                    console.log(`✅ Sincronizado: ${k}`);
                } else if (remoteData === null && localData !== null) {
                    // Si no hay datos remotos pero sí locales, subirlos
                    await upsertRemote(fullKey, localData);
                    syncCount++;
                    console.log(`📤 Subido a remoto: ${k}`);
                }
            } catch (keyError) {
                console.error(`❌ Error sincronizando ${k}:`, keyError);
                // Continuar con otras claves
            }
        }
        
        console.log(`🎉 Sincronización completada: ${syncCount} claves procesadas`);
        return true;
    } catch (error) {
        console.error('❌ Error crítico en forceSync:', error);
        return false;
    }
};

// Validar integridad de datos
const isValidData = (data, key) => {
    console.log('🔍 isValidData llamado:', { data, type: typeof data, key });
    
    if (data === null || data === undefined) return false;
    
    // activeRoutineId debe ser string o vacío (validar ANTES de JSON)
    if (key === 'activeRoutineId') {
        console.log('🔍 Validando activeRoutineId:', { data, type: typeof data, key });
        
        // Si es string, validar directamente
        if (typeof data === 'string') {
            const isValid = data === '' || data.trim().length > 0;
            console.log('🔍 Resultado validación (string):', { data, isValid });
            return isValid;
        }
        
        // Si no es string, convertir y validar
        const parsed = String(data);
        const isValid = parsed === '' || parsed.trim().length > 0;
        console.log('🔍 Resultado validación (convertido):', { parsed, isValid });
        return isValid;
    }
    
    // lastVisit debe ser un día de la semana válido o vacío (validar ANTES de JSON)
    if (key === 'lastVisit') {
        const validDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const isValid = validDays.includes(data) || data === '';
        console.log('🔍 Validando lastVisit:', { data, isValid, validDays });
        return isValid;
    }
    
    // Validar JSON (solo para otras claves)
    if (typeof data === 'string') {
        try {
            JSON.parse(data);
        } catch {
            return false;
        }
    }
    
    // Validar según tipo de clave
    if (key === 'routines' || key === 'widgets') {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            return Array.isArray(parsed);
        } catch {
            return false;
        }
    }
    
    // Para otras claves, si es un string, validar que no sea JSON corrupto
    if (typeof data === 'string') {
        try {
            JSON.parse(data);
            // Si es JSON válido, aceptarlo
            return true;
        } catch {
            // Si no es JSON, pero es un string simple, aceptarlo
            return true;
        }
    }
    
    return true;
};

const NS = "agendasmart:";
const BACKUP_PREFIX = "backup:";

const keyPrefix = (k) => NS + k;
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const toJson = (v) => { try { return JSON.stringify(v); } catch { return null; } };

// Función de backup local
const createBackup = (key, value) => {
    try {
        const backupKey = BACKUP_PREFIX + key;
        localStorage.setItem(backupKey, JSON.stringify({
            timestamp: Date.now(),
            data: value
        }));
    } catch (error) {
        console.warn('⚠️ No se pudo crear backup:', error);
    }
};

// Función de restauración desde backup
const restoreFromBackup = (key) => {
    try {
        const backupKey = BACKUP_PREFIX + key;
        const backup = localStorage.getItem(backupKey);
        if (backup) {
            const { timestamp, data } = JSON.parse(backup);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
            
            if (Date.now() - timestamp < maxAge) {
                console.log(`🔄 Restaurando ${key} desde backup`);
                return data;
            } else {
                localStorage.removeItem(backupKey);
            }
        }
    } catch (error) {
        console.warn('⚠️ Error restaurando backup:', error);
    }
    return null;
};

const putLocal = (k, v) => { 
    try { 
        const j = toJson(v); 
        if (j != null) {
            // Crear backup antes de sobrescribir
            const current = localStorage.getItem(k);
            if (current) {
                createBackup(k, parseJson(current));
            }
            localStorage.setItem(k, j); 
            return true; 
        }
        return false; 
    } catch (error) { 
        console.error('❌ Error en putLocal:', error);
        return false; 
    } 
};

const getLocal = (k) => { 
    try { 
        const r = localStorage.getItem(k); 
        return r == null ? null : parseJson(r); 
    } catch (error) { 
        console.error('❌ Error en getLocal:', error);
        // Intentar restaurar desde backup
        const backup = restoreFromBackup(k);
        if (backup !== null) {
            localStorage.setItem(k, toJson(backup));
            return backup;
        }
        return null; 
    } 
};

const removeLocal = (k) => { 
    try { 
        localStorage.removeItem(k); 
        // Limpiar backup
        localStorage.removeItem(BACKUP_PREFIX + k);
        return true; 
    } catch (error) { 
        console.error('❌ Error en removeLocal:', error);
        return false; 
    } 
};

const upsertRemote = async (k, v) => { 
    try { 
        const jsonValue = toJson(v);
        if (!jsonValue) {
            console.error('❌ No se pudo serializar valor para upsertRemote');
            return false;
        }
        
        const { error } = await supabase.from("kv").upsert({ key: k, value: jsonValue }); 
        if (error) {
            console.error('❌ Error en upsertRemote:', error);
            return false;
        }
        return true; 
    } catch (error) { 
        console.error('❌ Error crítico en upsertRemote:', error);
        return false; 
    } 
};

const deleteRemote = async (k) => { 
    try { 
        const { error } = await supabase.from("kv").delete().eq("key", k); 
        if (error) {
            console.error('❌ Error en deleteRemote:', error);
            return false;
        }
        return true; 
    } catch (error) { 
        console.error('❌ Error crítico en deleteRemote:', error);
        return false; 
    } 
};

const fetchRemote = async (k) => { 
    try { 
        const { data, error } = await supabase.from("kv").select("value").eq("key", k).maybeSingle(); 
        if (error) {
            console.error('❌ Error en fetchRemote:', error);
            return null;
        }
        
        if (!data || !data.value) {
            return null;
        }
        
        // Validar JSON antes de retornar
        try {
            // Si ya es JSONB (viene de Supabase), retornar directamente
            if (data.value && typeof data.value === 'object') {
                return data.value;
            }
            
            // Para lastVisit: si es un día de la semana, devolver directamente sin parsear
            if (k === 'agendasmart:lastVisit') {
                const validDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
                if (validDays.includes(data.value)) {
                    console.log('🔧 lastVisit detectado, devolviendo directamente:', data.value);
                    return data.value;
                }
            }
            
            // Si es string, intentar parsear
            const parsed = JSON.parse(data.value);
            return parsed;
        } catch (parseError) {
            console.error(`❌ JSON corrupto en clave ${k}:`, parseError);
            console.log('🔧 Valor corrupto:', data.value, 'Tipo:', typeof data.value);
            
            // Si es un objeto que vino de Supabase, retornarlo directamente
            if (typeof data.value === 'object' && data.value !== null) {
                console.log('🔧 Retornando objeto JSONB directamente:', data.value);
                return data.value;
            }
            
            // Intentar limpiar datos corruptos comunes
            // Para lastVisit: si es un día de la semana, devolver directamente
            if (data.value === '"sat"' || data.value === '"sun"' || data.value === '"mon"' || data.value === '"tue"' || data.value === '"wed"' || data.value === '"thu"' || data.value === '"fri"') {
                console.log('🔧 Corrigiendo día de semana:', data.value);
                return JSON.parse(data.value); // Parsear el string JSON para obtener el día
            }
            
            // Para días sin comillas (caso raro)
            if (data.value === 'sat' || data.value === 'sun' || data.value === 'mon' || data.value === 'tue' || data.value === 'wed' || data.value === 'thu' || data.value === 'fri') {
                console.log('🔧 Corrigiendo día de semana sin comillas:', data.value);
                return data.value; // Devolver el string directamente
            }
            
            // Para arrays/objetos vacíos, intentar parsear
            if (data.value === '[]' || data.value === '{}') {
                console.log('🔧 Corrigiendo array/object vacío:', data.value);
                return JSON.parse(data.value); // Parsear correctamente
            }
            
            // Para arrays/objetos vacíos con formato JSON correcto
            if (data.value === '"[]"' || data.value === '"{}"') {
                console.log('🔧 Corrigiendo array/object vacío con comillas:', data.value);
                return JSON.parse(data.value); // Parsear el string JSON
            }
            
            // Corregir datos notificados que se guardaron como [object Object]
            if (data.value === '[object Object]') {
                console.log('🔧 Corrigiendo [object Object]:', data.value);
                return {}; // Devolver objeto vacío
            }
            
            // Corregir objetos que se guardaron como string sin comillas
            if (typeof data.value === 'string' && data.value.startsWith('{') && data.value.includes('true') && !data.value.includes('"')) {
                console.log('🔧 Corrigiendo objeto sin comillas:', data.value);
                try {
                    // Agregar comillas a las claves
                    const fixed = data.value.replace(/(\w+):/g, '"$1":');
                    return JSON.parse(fixed);
                } catch {
                    console.log('🔧 No se pudo corregir objeto sin comillas, devolviendo objeto vacío');
                    return {};
                }
            }
            
            // Corregir strings que parecen objetos pero están mal formados
            if (typeof data.value === 'string' && data.value.includes('{') && data.value.includes('}')) {
                console.log('🔧 Intentando corregir objeto mal formado:', data.value);
                try {
                    // Intentar parsear directamente
                    return JSON.parse(data.value);
                } catch {
                    // Si falla, devolver objeto vacío
                    console.log('🔧 No se pudo corregir, devolviendo objeto vacío');
                    return {};
                }
            }
            
            return null;
        }
    } catch (error) { 
        console.error('❌ Error crítico en fetchRemote:', error);
        return null; 
    } 
};

const listRemoteKeys = async () => { 
    try { 
        const { data, error } = await supabase.from("kv").select("key"); 
        if (error) {
            console.error('❌ Error en listRemoteKeys:', error);
            return []; 
        }
        
        return (data || [])
            .map(x => x.key)
            .filter(k => typeof k === "string" && k.startsWith(NS))
            .map(k => k.substring(NS.length)); 
    } catch (error) { 
        console.error('❌ Error crítico en listRemoteKeys:', error);
        return []; 
    } 
};

// Versión mejorada de syncFromRemote con validación
export const syncFromRemote = async (force = false) => {
    try {
        console.log('🔄 Iniciando sincronización desde remoto...');
        const remoteKeys = await listRemoteKeys();
        let syncCount = 0;
        let errorCount = 0;
        
        for (const k of remoteKeys) {
            try {
                const full = keyPrefix(k);
                const remoteData = await fetchRemote(full);
                
                if (remoteData === null) {
                    console.log(`⚠️ Datos remotos nulos para: ${k}`);
                    continue;
                }
                
                // Validar datos remotos
                if (!isValidData(remoteData, k)) {
                    console.error(`❌ Datos remotos inválidos para: ${k}`);
                    errorCount++;
                    continue;
                }
                
                // Comparar con datos locales para sincronización inteligente
                const localData = getLocal(full);
                const shouldSync = force || !localData || JSON.stringify(localData) !== JSON.stringify(remoteData);
                
                if (shouldSync) {
                    putLocal(full, remoteData);
                    syncCount++;
                    console.log(`✅ Sincronizado: ${k}`);
                } else {
                    console.log(`⏭️ Sin cambios: ${k}`);
                }
            } catch (keyError) {
                console.error(`❌ Error procesando ${k}:`, keyError);
                errorCount++;
            }
        }
        
        console.log(`🎉 Sincronización completada: ${syncCount} actualizados, ${errorCount} errores`);
        return errorCount === 0;
    } catch (error) {
        console.error('❌ Error crítico en syncFromRemote:', error);
        return false;
    }
};

export const getItem = (key) => {
    const k = keyPrefix(key);
    const cached = getLocal(k);
    if (cached != null) return cached;
    
    // Fetch remoto asíncrono con validación
    fetchRemote(k).then(v => { 
        if (v != null && isValidData(v, key)) {
            putLocal(k, v);
        } else if (v != null) {
            console.error(`❌ Datos remotos inválidos para getItem(${key}):`, v);
        }
    }).catch(error => {
        console.error(`❌ Error fetch remoto getItem(${key}):`, error);
    });
    
    return null;
};

export const setItem = (key, value) => {
    const k = keyPrefix(key);
    
    console.log('🔍 setItem llamado:', { key, k, value, type: typeof value });
    
    // Validar valor antes de guardar
    if (!isValidData(value, key)) {
        console.error(`❌ Datos inválidos para setItem(${key}):`, value);
        return false;
    }
    
    const ok = putLocal(k, value);
    
    // Sincronización remota asíncrona con retry
    upsertRemote(k, value).catch(error => {
        console.error(`❌ Error sincronizando ${key}:`, error);
        // Intentar una vez más después de 2 segundos
        setTimeout(() => {
            upsertRemote(k, value).catch(retryError => {
                console.error(`❌ Retry fallido para ${key}:`, retryError);
            });
        }, 2000);
    });
    
    return ok;
};

export const removeItem = (key, remote = false) => {
    const k = keyPrefix(key);
    const ok = removeLocal(k);
    if (remote) {
        deleteRemote(k).catch(error => {
            console.error(`❌ Error eliminando remoto ${key}:`, error);
        });
    }
    return ok;
};

export const keys = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(NS) && !k.startsWith(BACKUP_PREFIX)) {
            out.push(k.substring(NS.length));
        }
    }
    return out;
};

// Función de diagnóstico
export const diagnoseData = async () => {
    console.log('🔍 Iniciando diagnóstico de datos...');
    
    const localKeys = keys();
    const remoteKeys = await listRemoteKeys();
    
    console.log(`📊 Claves locales: ${localKeys.length}`);
    console.log(`📊 Claves remotas: ${remoteKeys.length}`);
    
    const issues = [];
    
    for (const key of ['routines', 'widgets', 'activeRoutineId']) {
        const local = getLocal(keyPrefix(key));
        const remote = await fetchRemote(keyPrefix(key));
        
        console.log(`📋 ${key}:`);
        console.log(`   Local: ${local ? '✅' : '❌'} ${Array.isArray(local) ? `(${local.length} items)` : ''}`);
        console.log(`   Remoto: ${remote ? '✅' : '❌'} ${Array.isArray(remote) ? `(${remote.length} items)` : ''}`);
        
        if (local && !isValidData(local, key)) {
            issues.push(`Datos locales corruptos: ${key}`);
        }
        if (remote && !isValidData(remote, key)) {
            issues.push(`Datos remotos corruptos: ${key}`);
        }
    }
    
    if (issues.length > 0) {
        console.error('❌ Problemas encontrados:');
        issues.forEach(issue => console.error(`   - ${issue}`));
    } else {
        console.log('✅ No se encontraron problemas');
    }
    
    return issues;
};
