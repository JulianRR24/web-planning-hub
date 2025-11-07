import { getItem, setItem } from "./storage.js";
import { qs, on, uid } from "./ui.js";

const applyTheme = () => {
    const theme = getItem("theme") || "light";
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
};

const toggleTheme = () => {
    const saved = getItem("theme");
    const next = saved === "dark" ? "light" : "dark";
    setItem("theme", next);
    applyTheme();
};

const initPage = () => {
    applyTheme();
    on(qs("#themeToggle"), "click", toggleTheme);
    on(qs("#saveWidget"), "click", saveWidget);
    on(qs("#clearWidgets"), "click", clearWidgets);
    renderList();
};

const readForm = () => {
    const type = qs("#widgetType").value;
    const title = qs("#widgetTitle").value.trim() || type;
    const order = Math.min(4, Math.max(1, Number(qs("#widgetOrder").value || 1)));
    const enabled = qs("#widgetEnabled").checked;
    return { id: uid("w_"), type, title, order, enabled };
};

const saveWidget = () => {
    const w = readForm();
    const list = getItem("widgets") || [];
    if (w.enabled && list.filter(x => x.enabled).length >= 4) w.enabled = false;
    if (w.type === "market") w.items = [];
    if (w.type === "notes") w.items = [];
    if (w.type === "quotes") w.items = [];
    if (w.type === "pico_placa") w.plateDigit = "";
    if (w.type === "siata") w.url = "https://geoportal.siata.gov.co/";
    setItem("widgets", [...list, w]);
    renderList();
};

const clearWidgets = () => {
    setItem("widgets", []);
    renderList();
};

const renderList = () => {
    const wrap = qs("#widgetsList");
    wrap.innerHTML = "";
    const list = getItem("widgets") || [];
    list.sort((a, b) => a.order - b.order).forEach(w => {
        const row = document.createElement("div");
        row.className = "p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800";
        const top = document.createElement("div");
        top.className = "flex items-center justify-between mb-2";
        const title = document.createElement("div");
        title.className = "font-medium";
        title.textContent = w.title + " • " + w.type;
        const right = document.createElement("div");
        right.className = "flex items-center gap-2";
        const toggle = document.createElement("button");
        toggle.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
        toggle.textContent = w.enabled ? "Ocultar" : "Mostrar";
        on(toggle, "click", () => toggleWidget(w.id));
        const del = document.createElement("button");
        del.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
        del.textContent = "Eliminar";
        on(del, "click", () => deleteWidget(w.id));
        right.appendChild(toggle);
        right.appendChild(del);
        top.appendChild(title);
        top.appendChild(right);
        row.appendChild(top);
        if (w.type === "market") row.appendChild(renderMarketEditor(w));
        if (w.type === "notes") row.appendChild(renderNotesEditor(w));
        if (w.type === "quotes") row.appendChild(renderQuotesEditor(w));
        if (w.type === "pico_placa") row.appendChild(renderPicoPlacaEditor(w));
        wrap.appendChild(row);
    });
};

const toggleWidget = (id) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) return;
    const visible = list.filter(x => x.enabled).length;
    if (!list[idx].enabled && visible >= 4) return;
    list[idx].enabled = !list[idx].enabled;
    setItem("widgets", list);
    renderList();
};

const deleteWidget = (id) => {
    const list = getItem("widgets") || [];
    setItem("widgets", list.filter(x => x.id !== id));
    renderList();
};

const renderMarketEditor = (w) => {
    const wrap = document.createElement("div");
    const form = document.createElement("div");
    form.className = "flex items-center gap-2 mb-2";
    const input = document.createElement("input");
    input.className = "flex-1 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
    input.placeholder = "Agregar ítem";
    const add = document.createElement("button");
    add.className = "px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700";
    add.textContent = "Agregar";
    form.appendChild(input);
    form.appendChild(add);
    on(add, "click", () => {
        const text = input.value.trim();
        if (!text) return;
        const list = getItem("widgets") || [];
        const idx = list.findIndex(x => x.id === w.id);
        if (idx < 0) return;
        list[idx].items = [...(list[idx].items || []), { id: uid("m_"), text, done: false }];
        setItem("widgets", list);
        renderList();
    });
    const ul = document.createElement("div");
    (w.items || []).forEach(it => {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!it.done;
        on(cb, "change", () => toggleMarketItem(w.id, it.id));
        const text = document.createElement("input");
        text.className = "flex-1 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700";
        text.value = it.text;
        on(text, "change", () => editMarketItem(w.id, it.id, text.value));
        const del = document.createElement("button");
        del.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
        del.textContent = "Eliminar";
        on(del, "click", () => deleteMarketItem(w.id, it.id));
        row.appendChild(cb);
        row.appendChild(text);
        row.appendChild(del);
        ul.appendChild(row);
    });
    wrap.appendChild(form);
    wrap.appendChild(ul);
    return wrap;
};

const toggleMarketItem = (wid, iid) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    const items = list[idx].items || [];
    const i = items.findIndex(x => x.id === iid);
    if (i < 0) return;
    items[i].done = !items[i].done;
    setItem("widgets", list);
    renderList();
};

const editMarketItem = (wid, iid, text) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    const items = list[idx].items || [];
    const i = items.findIndex(x => x.id === iid);
    if (i < 0) return;
    items[i].text = text.trim();
    setItem("widgets", list);
};

const deleteMarketItem = (wid, iid) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    list[idx].items = (list[idx].items || []).filter(x => x.id !== iid);
    setItem("widgets", list);
    renderList();
};

const renderNotesEditor = (w) => {
    const wrap = document.createElement("div");
    const form = document.createElement("div");
    form.className = "flex items-center gap-2 mb-2";
    const input = document.createElement("input");
    input.className = "flex-1 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
    input.placeholder = "Nueva tarea";
    const add = document.createElement("button");
    add.className = "px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700";
    add.textContent = "Agregar";
    form.appendChild(input);
    form.appendChild(add);
    on(add, "click", () => {
        const text = input.value.trim();
        if (!text) return;
        const list = getItem("widgets") || [];
        const idx = list.findIndex(x => x.id === w.id);
        if (idx < 0) return;
        list[idx].items = [...(list[idx].items || []), { id: uid("n_"), text, done: false }];
        setItem("widgets", list);
        renderList();
    });
    const ul = document.createElement("div");
    (w.items || []).forEach(it => {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!it.done;
        on(cb, "change", () => toggleNoteItem(w.id, it.id));
        const text = document.createElement("input");
        text.className = "flex-1 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700";
        text.value = it.text;
        on(text, "change", () => editNoteItem(w.id, it.id, text.value));
        const del = document.createElement("button");
        del.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
        del.textContent = "Eliminar";
        on(del, "click", () => deleteNoteItem(w.id, it.id));
        row.appendChild(cb);
        row.appendChild(text);
        row.appendChild(del);
        ul.appendChild(row);
    });
    wrap.appendChild(form);
    wrap.appendChild(ul);
    return wrap;
};

const toggleNoteItem = (wid, iid) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    const items = list[idx].items || [];
    const i = items.findIndex(x => x.id === iid);
    if (i < 0) return;
    items[i].done = !items[i].done;
    setItem("widgets", list);
    renderList();
};

const editNoteItem = (wid, iid, text) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    const items = list[idx].items || [];
    const i = items.findIndex(x => x.id === iid);
    if (i < 0) return;
    items[i].text = text.trim();
    setItem("widgets", list);
};

const deleteNoteItem = (wid, iid) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    list[idx].items = (list[idx].items || []).filter(x => x.id !== iid);
    setItem("widgets", list);
    renderList();
};

const renderQuotesEditor = (w) => {
    const wrap = document.createElement("div");
    const form = document.createElement("div");
    form.className = "flex items-center gap-2 mb-2";
    const input = document.createElement("input");
    input.className = "flex-1 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
    input.placeholder = "Nueva frase";
    const add = document.createElement("button");
    add.className = "px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700";
    add.textContent = "Agregar";
    form.appendChild(input);
    form.appendChild(add);
    on(add, "click", () => {
        const text = input.value.trim();
        if (!text) return;
        const list = getItem("widgets") || [];
        const idx = list.findIndex(x => x.id === w.id);
        if (idx < 0) return;
        list[idx].items = [...(list[idx].items || []), { id: uid("q_"), text }];
        setItem("widgets", list);
        renderList();
    });
    const ul = document.createElement("div");
    (w.items || []).forEach(it => {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2";
        const text = document.createElement("input");
        text.className = "flex-1 px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700";
        text.value = it.text;
        on(text, "change", () => editQuoteItem(w.id, it.id, text.value));
        const del = document.createElement("button");
        del.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
        del.textContent = "Eliminar";
        on(del, "click", () => deleteQuoteItem(w.id, it.id));
        row.appendChild(text);
        row.appendChild(del);
        ul.appendChild(row);
    });
    wrap.appendChild(form);
    wrap.appendChild(ul);
    return wrap;
};

const editQuoteItem = (wid, iid, text) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    const items = list[idx].items || [];
    const i = items.findIndex(x => x.id === iid);
    if (i < 0) return;
    items[i].text = text.trim();
    setItem("widgets", list);
};

const deleteQuoteItem = (wid, iid) => {
    const list = getItem("widgets") || [];
    const idx = list.findIndex(x => x.id === wid);
    if (idx < 0) return;
    list[idx].items = (list[idx].items || []).filter(x => x.id !== iid);
    setItem("widgets", list);
    renderList();
};

const renderPicoPlacaEditor = (w) => {
    const wrap = document.createElement("div");
    const form = document.createElement("div");
    form.className = "flex items-center gap-2";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "9";
    input.value = w.plateDigit ?? "";
    input.className = "w-28 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
    const save = document.createElement("button");
    save.className = "px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700";
    save.textContent = "Guardar dígito";
    on(save, "click", () => {
        const digit = String(Math.max(0, Math.min(9, Number(input.value))))
        const list = getItem("widgets") || [];
        const idx = list.findIndex(x => x.id === w.id);
        if (idx < 0) return;
        list[idx].plateDigit = digit;
        setItem("widgets", list);
        renderList();
    });
    form.appendChild(input);
    form.appendChild(save);
    wrap.appendChild(form);
    return wrap;
};

document.addEventListener("DOMContentLoaded", initPage);
