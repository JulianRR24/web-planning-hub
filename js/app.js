import { getItem, setItem } from "./storage.js";
import { qs, qsa, on, uid, todayKey, hhmmToMinutes, minutesToTop } from "./ui.js";

const themeToggle = () => {
    const saved = getItem("theme");
    const next = saved === "dark" ? "light" : "dark";
    setItem("theme", next);
    applyTheme();
};

const applyTheme = () => {
    const theme = getItem("theme") || "light";
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
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
    const renderData = (data, label) => {
        const t = Math.round(data.current?.temperature ?? 0);
        const desc = data.current?.summary || "";
        const icon = data.current?.icon || "";
        container.innerHTML = "";
        const box = document.createElement("div");
        box.className = "flex items-center gap-3 w-full sm:w-auto";
        const ico = document.createElement("div");
        ico.className = "px-2 py-1 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs";
        ico.textContent = icon;
        const texts = document.createElement("div");
        texts.className = "flex flex-col";
        const line1 = document.createElement("div");
        line1.className = "text-base font-semibold";
        line1.textContent = t + "°C";
        const line2 = document.createElement("div");
        line2.className = "text-xs opacity-80";
        line2.textContent = desc || "No disponible";
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
            const params = new URLSearchParams({ lat: String(lat), lon: String(lon), sections: "current", units: "metric", lang: "es", key });
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
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
    applyTheme();
    on(qs("#themeToggle"), "click", themeToggle);
    renderWidgetsOnHome();
    hoursColumn();
    dayGridLayout();
    activeRoutineSelector();
    currentDateText();
    timeNeedle();
    setInterval(timeNeedle, 30000);
};

document.addEventListener("DOMContentLoaded", initHome);
