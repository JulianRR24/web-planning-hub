import { getItem, setItem } from "./storage.js";
import { qs, qsa, on, uid, todayKey, hhmmToMinutes, minutesToTop } from "./ui.js";

let swReg = null;

const registerServiceWorker = async () => {
    try {
        if (!('serviceWorker' in navigator)) return;
        swReg = await navigator.serviceWorker.register('./service-worker.js');
        await navigator.serviceWorker.ready;
    } catch { }
};

const ensureBootstrapData = () => {
    const routines = getItem("routines") || [];
    const widgets = getItem("widgets") || [];
    if (!routines.length) setItem("routines", []);
    if (!widgets.length) setItem("widgets", []);
    if (!getItem("activeRoutineId")) setItem("activeRoutineId", "");
};

const renderWidgetsOnHome = () => {
    const grid = qs("#widgetsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const widgets = (getItem("widgets") || []).filter(w => w.enabled).sort((a, b) => a.order - b.order).slice(0, 4);
    widgets.forEach(w => {
        const card = document.createElement("div");
        card.className = "p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800";
        const title = document.createElement("div");
        title.className = "font-medium mb-2";
        title.textContent = w.title || w.type;
        const body = document.createElement("div");
        body.className = "text-sm";
        if (w.type === "market") body.appendChild(renderMarketWidgetSummary());
        if (w.type === "notes") body.textContent = (w.items || []).filter(x => !x.done).slice(0, 5).map(x => "• " + x.text).join("\n") || "Sin tareas";
        if (w.type === "quotes") body.textContent = (w.items || [])[0]?.text || "Agrega frases en Widgets";
        if (w.type === "weather") body.appendChild(renderWeatherWidget());
        if (w.type === "pico_placa") {
            const el = renderPicoPlacaSummary(w);
            body.appendChild(el);
            card.style.cursor = "pointer";
            on(card, "click", () => window.open("https://www.medellin.gov.co/es/secretaria-de-movilidad/pico-y-placa-medellin-2023-segundo-semestre/", "_blank"));
        }
        if (w.type === "siata") body.appendChild(renderSiataLink());
        card.appendChild(title);
        card.appendChild(body);
        grid.appendChild(card);
    });
    on(qs("#manageWidgets"), "click", () => location.href = "./widgets.html");
};

const renderMarketWidgetSummary = () => {
    const wrap = document.createElement("div");
    const w = (getItem("widgets") || []).find(x => x.type === "market");
    const items = w?.items || [];
    const pending = items.filter(i => !i.done).length;
    const bought = items.filter(i => i.done).length;
    wrap.innerHTML = `<div class="flex items-center justify-between"><span>Pendientes</span><span class="font-semibold">${pending}</span></div><div class="flex items-center justify-between"><span>Comprados</span><span class="font-semibold">${bought}</span></div>`;
    return wrap;
};

const renderWeatherWidget = () => {
    const wrap = document.createElement("div");
    wrap.className = "flex items-center justify-center p-3 rounded-md bg-slate-900/5 dark:bg-white/5 backdrop-blur-sm animate-[fadeIn_.3s_ease]";
    wrap.textContent = "Cargando clima...";
    loadWeatherInto(wrap);
    return wrap;
};

const renderSiataLink = () => {
    const a = document.createElement("a");
    a.href = "https://geoportal.siata.gov.co/";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "inline-flex items-center text-indigo-600 hover:underline";
    a.textContent = "Abrir radar SIATA";
    return a;
};

const picoPlacaSchedule = () => ({
    mon: ["6", "9"],
    tue: ["5", "7"],
    wed: ["1", "8"],
    thu: ["0", "2"],
    fri: ["3", "4"],
    sat: [],
    sun: []
});

const dateToKey = (d) => {
    const i = d.getDay();
    if (i === 0) return "sun";
    if (i === 1) return "mon";
    if (i === 2) return "tue";
    if (i === 3) return "wed";
    if (i === 4) return "thu";
    if (i === 5) return "fri";
    return "sat";
};

const renderPicoPlacaSummary = (w) => {
    const wrap = document.createElement("div");
    const digit = (w.plateDigit ?? "").toString();
    const sched = picoPlacaSchedule();
    const now = new Date();
    const today = dateToKey(now);
    const tomorrow = dateToKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const todayMatch = digit && sched[today].includes(digit);
    const tomorrowMatch = digit && sched[tomorrow].includes(digit);
    const todayRow = document.createElement("div");
    const tomorrowRow = document.createElement("div");
    todayRow.className = "flex items-center justify-between";
    tomorrowRow.className = "flex items-center justify-between";
    const todayLabel = document.createElement("span");
    todayLabel.textContent = "Hoy";
    const todayVal = document.createElement("span");
    todayVal.className = todayMatch ? "font-semibold text-rose-600" : "opacity-70";
    todayVal.textContent = todayMatch ? "Restricción" : "Libre";
    const tomorrowLabel = document.createElement("span");
    tomorrowLabel.textContent = "Mañana";
    const tomorrowVal = document.createElement("span");
    tomorrowVal.className = !todayMatch && tomorrowMatch ? "font-semibold text-amber-500" : "opacity-70";
    tomorrowVal.textContent = !todayMatch && tomorrowMatch ? "Restricción" : "Libre";
    todayRow.appendChild(todayLabel);
    todayRow.appendChild(todayVal);
    tomorrowRow.appendChild(tomorrowLabel);
    tomorrowRow.appendChild(tomorrowVal);
    const digitsRow = document.createElement("div");
    digitsRow.className = "mt-1 text-xs opacity-70";
    digitsRow.textContent = `Hoy: ${sched[today].join(", ") || "N/A"} • Mañana: ${sched[tomorrow].join(", ") || "N/A"}`;
    if (!digit) {
        const tip = document.createElement("div");
        tip.className = "mt-1 text-xs text-indigo-600";
        tip.textContent = "Define tu dígito en Widgets";
        wrap.appendChild(tip);
    }
    wrap.appendChild(todayRow);
    wrap.appendChild(tomorrowRow);
    wrap.appendChild(digitsRow);
    return wrap;
};

const loadWeatherInto = (container) => {
    const key = "b85hhdhrltub8nwrf64enmk6hn7uylijvq153y52";
    const showError = (msg) => {
        container.className = "flex items-center justify-center p-3 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400";
        container.textContent = msg;
    };
    const translateSummary = (s) => {
        if (!s) return "";
        const m = {
            "Clear": "Despejado",
            "Sunny": "Soleado",
            "Partly cloudy": "Parcialmente nublado",
            "Mostly cloudy": "Mayormente nublado",
            "Cloudy": "Nublado",
            "Overcast": "Cubierto",
            "Fog": "Niebla",
            "Mist": "Neblina",
            "Haze": "Calima",
            "Drizzle": "Llovizna",
            "Light rain": "Lluvia ligera",
            "Rain": "Lluvia",
            "Moderate rain": "Lluvia moderada",
            "Heavy rain": "Lluvia intensa",
            "Thunderstorm": "Tormenta",
            "Snow": "Nieve",
            "Light snow": "Nieve ligera",
            "Sleet": "Aguanieve",
            "Windy": "Viento"
        };
        return m[s] || s;
    };

    const svgNode = (s) => {
        const d = document.createElement("div");
        d.innerHTML = s.trim();
        return d.firstChild;
    };
    const iconSvg = (code) => {
        const k = String(code || "").toLowerCase();
        if (k.includes("thunder")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 15a4 4 0 1 1 .9-7.9A5 5 0 0 1 17 9a3 3 0 1 1 1 5h-3"/><path d="M13 11l-3 5h3l-2 4"/></svg>');
        if (k.includes("rain") || k.includes("drizzle")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 15a4 4 0 1 1 .9-7.9A5 5 0 0 1 17 9a3 3 0 1 1 1 5H7"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/></svg>');
        if (k.includes("snow") || k.includes("sleet")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 15a4 4 0 1 1 .9-7.9A5 5 0 0 1 17 9a3 3 0 1 1 1 5H7"/><path d="M10 18l2 2m0-2l-2 2M14 18l2 2m0-2l-2 2"/></svg>');
        if (k.includes("fog") || k.includes("mist") || k.includes("haze")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h12M2 13h18M3 16h14"/><path d="M7 9a4 4 0 1 1 .9-7.9A5 5 0 0 1 17 3a3 3 0 1 1 1 5H7"/></svg>');
        if (k.includes("wind")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h10a3 3 0 1 0-3-3"/><path d="M5 16h8a3 3 0 1 1-3 3"/></svg>');
        if (k.includes("partly")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13"/><path d="M7 16h10a3 3 0 0 0 0-6 5 5 0 0 0-9 2"/></svg>');
        if (k.includes("overcast") || k.includes("cloud")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 16h10a3 3 0 0 0 0-6 5 5 0 0 0-9 2"/></svg>');
        if (k.includes("clear") || k.includes("sun")) return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4"/></svg>');
        return svgNode('<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h18"/><circle cx="12" cy="12" r="4"/></svg>');
    };

    const renderData = (data, label) => {
        const t = Math.round(data.current?.temperature ?? 0);
        const desc = data.current?.summary || "";
        const descEs = translateSummary(desc);
        const icon = data.current?.icon || "";
        container.innerHTML = "";
        const box = document.createElement("div");
        box.className = "flex items-center gap-3 w-full sm:w-auto";
        const ico = document.createElement("div");
        ico.className = "w-9 h-9 flex items-center justify-center rounded-full bg-slate-200 text-lg dark:bg-slate-700";
        ico.appendChild(iconSvg(icon));
        const texts = document.createElement("div");
        texts.className = "flex flex-col";
        const line1 = document.createElement("div");
        line1.className = "text-base font-semibold";
        line1.textContent = t + "°C";
        const line2 = document.createElement("div");
        line2.className = "text-xs opacity-80";
        line2.textContent = descEs || "No disponible";
        const line3 = document.createElement("div");
        line3.className = "text-xs opacity-60";
        line3.textContent = label || "Tu ubicación";
        texts.appendChild(line1);
        texts.appendChild(line2);
        texts.appendChild(line3);
        box.appendChild(ico);
        box.appendChild(texts);
        container.appendChild(box);
    };
    const fetchPlaceName = async (lat, lon) => {
        try {
            const params = new URLSearchParams({ lat: String(lat), lon: String(lon), key });
            const url = "https://www.meteosource.com/api/v1/free/nearest_place?" + params.toString();
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json();
            return data?.name || null;
        } catch { return null; }
    };

    const fetchWeather = async (lat, lon) => {
        try {
            const params = new URLSearchParams({ lat: String(lat), lon: String(lon), sections: "current", units: "metric", key });
            const url = "https://www.meteosource.com/api/v1/free/point?" + params.toString();
            const res = await fetch(url);
            if (!res.ok) throw new Error("fail");
            const data = await res.json();
            renderData(data, "Tu ubicación");
            const place = await fetchPlaceName(lat, lon);
            if (place) renderData(data, place);
        } catch {
            showError("No disponible");
        }
    };
    if (!navigator.geolocation) {
        showError("No se pudo obtener tu ubicación.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            fetchWeather(latitude, longitude);
        },
        () => showError("No se pudo obtener tu ubicación."),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 120000 }
    );
};

const hoursColumn = () => {
    const col = qs("#hoursColumn");
    if (!col) return;
    col.innerHTML = "";
    for (let h = 0; h < 24; h++) {
        const div = document.createElement("div");
        div.textContent = String(h).padStart(2, "0") + ":00";
        col.appendChild(div);
    }
};

const dayGridLayout = () => {
    const grid = qs("#dayGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const routineId = getItem("activeRoutineId") || "";
    const routines = getItem("routines") || [];
    const routine = routines.find(r => r.id === routineId);
    const key = todayKey();
    const events = routine?.days?.[key] || [];
    events.forEach(ev => {
        const top = minutesToTop(hhmmToMinutes(ev.start));
        const bottom = minutesToTop(hhmmToMinutes(ev.end));
        const el = document.createElement("div");
        el.className = "event-block border border-slate-200 dark:border-slate-700";
        el.style.top = top + "px";
        el.style.height = Math.max(24, bottom - top) + "px";
        el.style.background = ev.color || "#c7d2fe";
        el.textContent = ev.title;
        grid.appendChild(el);
    });
};

const timeNeedle = () => {
    const grid = qs("#dayGrid");
    const needle = qs("#timeNeedle");
    const tag = qs("#timeTag");
    if (!grid || !needle || !tag) return;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const y = minutesToTop(mins);
    needle.style.top = y + "px";
    tag.style.top = y + "px";
    tag.style.left = "8px";
    tag.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const activeRoutineSelector = () => {
    const select = qs("#activeRoutineSelector");
    if (!select) return;
    select.innerHTML = "";
    const routines = getItem("routines") || [];
    const activeId = getItem("activeRoutineId") || "";
    const optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "Sin rutina";
    select.appendChild(optNone);
    routines.forEach(r => {
        const o = document.createElement("option");
        o.value = r.id;
        o.textContent = r.name;
        if (r.id === activeId) o.selected = true;
        select.appendChild(o);
    });
    on(select, "change", () => {
        setItem("activeRoutineId", select.value);
        dayGridLayout();
    });
};

const currentDateText = () => {
    const el = qs("#currentDate");
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long" });
};

const initHome = () => {
    ensureBootstrapData();
    wireSettings();
    registerServiceWorker();
    renderWidgetsOnHome();
    hoursColumn();
    dayGridLayout();
    activeRoutineSelector();
    currentDateText();
    timeNeedle();
    setInterval(timeNeedle, 30000);
    startNotificationScheduler();
};

document.addEventListener("DOMContentLoaded", initHome);

const wireSettings = () => {
    const settingsBtn = qs("#settingsBtn");
    const modal = qs("#settingsModal");
    const closeBtn = qs("#settingsClose");
    const saveSettings = qs("#saveSettings");
    const askNotifyPerm = qs("#askNotifyPerm");
    const askGeoPerm = qs("#askGeoPerm");
    const ns = getItem("notifyBeforeStart") ?? 10;
    const ne = getItem("notifyBeforeEnd") ?? 5;
    const nsEl = qs("#notifyBeforeStart");
    const neEl = qs("#notifyBeforeEnd");
    if (nsEl) nsEl.value = ns;
    if (neEl) neEl.value = ne;
    on(settingsBtn, "click", () => { if (modal) { modal.classList.remove("hidden"); modal.classList.add("flex"); } });
    on(closeBtn, "click", () => { if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); } });
    on(saveSettings, "click", () => {
        const v1 = Number(nsEl?.value || 10);
        const v2 = Number(neEl?.value || 5);
        setItem("notifyBeforeStart", Math.max(0, v1));
        setItem("notifyBeforeEnd", Math.max(0, v2));
        if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); }
    });
    on(askNotifyPerm, "click", async () => {
        try {
            const res = await Notification.requestPermission();
            updatePermStates();
            if (res === 'granted') {
                const body = { body: 'Notificaciones activadas' };
                if (swReg?.showNotification) swReg.showNotification('AgendaSmart', body); else new Notification('AgendaSmart', body);
            }
        } catch { }
    });
    on(askGeoPerm, "click", async () => {
        try {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(() => updatePermStates(), () => updatePermStates(), { enableHighAccuracy: true, timeout: 8000 });
        } catch { }
    });

    const updateButtonStyle = (el, active, label) => {
        if (!el) return;
        el.textContent = label;
        el.className = active
            ? "px-3 py-2 rounded-md border border-emerald-500 text-emerald-600"
            : "px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700";
    };

    const updatePermStates = async () => {
        try {
            const notif = Notification?.permission === "granted";
            updateButtonStyle(askNotifyPerm, notif, notif ? "Notificaciones: activas" : "Permiso de notificaciones");
        } catch { }
        try {
            if (navigator.permissions) {
                const geo = await navigator.permissions.query({ name: "geolocation" });
                const granted = geo.state === "granted";
                updateButtonStyle(askGeoPerm, granted, granted ? "Ubicación: activa" : "Permiso de ubicación");
                geo.onchange = () => updatePermStates();
            } else {
                updateButtonStyle(askGeoPerm, false, "Permiso de ubicación");
            }
        } catch {
            updateButtonStyle(askGeoPerm, false, "Permiso de ubicación");
        }
    };
    updatePermStates();
};

const startNotificationScheduler = () => {
    const tick = () => {
        if (Notification?.permission !== "granted") return;
        const routineId = getItem("activeRoutineId") || "";
        const routines = getItem("routines") || [];
        const routine = routines.find(r => r.id === routineId);
        if (!routine) return;
        const key = todayKey();
        const events = routine.days?.[key] || [];
        const beforeStart = Number(getItem("notifyBeforeStart") ?? 10);
        const beforeEnd = Number(getItem("notifyBeforeEnd") ?? 5);
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const dateKey = now.toISOString().slice(0, 10);
        const notifKey = `notified:${dateKey}`;
        const notified = getItem(notifKey) || {};
        const notify = (title, options) => {
            try {
                if (swReg?.showNotification) swReg.showNotification(title, options); else new Notification(title, options);
            } catch { }
        };
        events.forEach(ev => {
            const s = hhmmToMinutes(ev.start);
            const e = hhmmToMinutes(ev.end);
            const nsMin = Math.max(0, s - beforeStart);
            const neMin = Math.max(0, e - beforeEnd);
            if (nowMin >= nsMin) {
                const id = ev.id + "_start";
                if (!notified[id]) { notify(ev.title || "Evento", { body: "Próximo inicio " + ev.start }); notified[id] = true; }
            }
            if (nowMin >= neMin) {
                const id2 = ev.id + "_end";
                if (!notified[id2]) { notify(ev.title || "Evento", { body: "Próximo fin " + ev.end }); notified[id2] = true; }
            }
        });
        setItem(notifKey, notified);
    };
    tick();
    setInterval(tick, 60000);
};
