import { getItem, setItem, syncFromRemote } from "./storage.js";
import { qs, qsa, on, uid, days, dayName } from "./ui.js";

const state = { editingId: "", buffer: null, editingEventId: "" };

const initPage = async () => {
  await syncFromRemote();
  
  // Inicializar buffer si no existe
  if (!state.buffer) {
    state.buffer = emptyRoutine();
  }
  
  mountDaySelect();
  renderRoutines();
  wireEditor();
};

const emptyRoutine = () => ({ id: uid("r_"), name: "", days: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } });

const readFormRoutine = () => {
  const name = qs("#routineName").value.trim();
  if (!name) return null;
  const r = state.buffer || emptyRoutine();
  r.name = name;
  return r;
};

const mountDaySelect = () => {
  const sel = qs("#routineDay");
  sel.innerHTML = "";
  days.forEach(k => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = dayName[k];
    sel.appendChild(o);
  });
  sel.value = "mon";
};

const normalizeTime = (t) => t && t.length === 5 ? t : "00:00";

const addEventToBuffer = () => {
  const day = qs("#routineDay").value;
  const start = normalizeTime(qs("#eventStart").value);
  const end = normalizeTime(qs("#eventEnd").value);
  const title = qs("#eventTitle").value.trim();
  const desc = (qs("#eventDesc")?.value || "").trim();
  const category = qs("#eventCategory").value.trim();
  const color = qs("#eventColor").value || "#c7d2fe";
  if (!title) return;
  
  // Asegurar que siempre hay un buffer válido
  const buf = state.buffer || emptyRoutine();
  
  if (state.editingEventId) {
    buf.days[day] = buf.days[day].map(x => x.id === state.editingEventId ? { ...x, start, end, title, desc, category, color } : x).sort((a, b) => a.start.localeCompare(b.start));
    state.editingEventId = "";
    const btn = qs("#addEventBtn");
    if (btn) btn.textContent = "Agregar evento";
  } else {
    const ev = { id: uid("e_"), start, end, title, desc, category, color };
    buf.days[day] = [...buf.days[day], ev].sort((a, b) => a.start.localeCompare(b.start));
  }
  state.buffer = buf;
  renderDayEvents();
};

const renderDayEvents = () => {
  const wrap = qs("#dayEvents");
  wrap.innerHTML = "";
  const day = qs("#routineDay").value;
  const list = state.buffer?.days?.[day] || [];
  list.forEach(ev => {
    const row = document.createElement("div");
    row.className = "flex items-center gap-2 p-2 rounded-md border border-slate-200 dark:border-slate-700";
    const t = document.createElement("div");
    t.className = "text-sm w-28";
    t.textContent = ev.start + " - " + ev.end;
    const d = document.createElement("div");
    d.className = "flex-1 text-sm";
    const titleEl = document.createElement("div");
    titleEl.className = "font-medium";
    titleEl.textContent = ev.title;
    const descEl = document.createElement("div");
    descEl.className = "whitespace-pre-wrap opacity-80";
    descEl.textContent = ev.desc || "";
    d.appendChild(titleEl);
    d.appendChild(descEl);
    const c = document.createElement("div");
    c.className = "w-5 h-5 rounded";
    c.style.background = ev.color;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
    edit.textContent = "Editar";
    on(edit, "click", () => {
      qs("#eventStart").value = ev.start;
      qs("#eventEnd").value = ev.end;
      qs("#eventTitle").value = ev.title;
      if (qs("#eventDesc")) qs("#eventDesc").value = ev.desc || "";
      qs("#eventCategory").value = ev.category || "";
      qs("#eventColor").value = ev.color || "#c7d2fe";
      state.editingEventId = ev.id;
      const btn = qs("#addEventBtn");
      if (btn) btn.textContent = "Actualizar";
    });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
    del.textContent = "Eliminar";
    on(del, "click", () => {
      const day = qs("#routineDay").value;
      state.buffer.days[day] = state.buffer.days[day].filter(x => x.id !== ev.id);
      renderDayEvents();
    });
    row.appendChild(t);
    row.appendChild(d);
    row.appendChild(c);
    row.appendChild(edit);
    row.appendChild(del);
    wrap.appendChild(row);
  });
};

const saveRoutine = () => {
  const r = readFormRoutine();
  if (!r) return;
  const list = getItem("routines") || [];
  if (!state.editingId) {
    const toSave = { ...state.buffer, id: r.id, name: r.name };
    setItem("routines", [...list, toSave]);
    state.editingId = toSave.id;
  } else {
    const idx = list.findIndex(x => x.id === state.editingId);
    if (idx >= 0) {
      list[idx] = { ...state.buffer, id: state.editingId, name: r.name };
      setItem("routines", list);
    }
  }
  renderRoutines();
};

const renderRoutines = () => {
  const list = getItem("routines") || [];
  const wrap = qs("#routinesList");
  wrap.innerHTML = "";
  list.forEach(r => {
    const card = document.createElement("div");
    card.className = "p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800";
    const head = document.createElement("div");
    head.className = "flex items-center justify-between mb-2";
    const title = document.createElement("div");
    title.className = "font-medium";
    title.textContent = r.name;
    const actions = document.createElement("div");
    actions.className = "flex items-center gap-2";
    const activate = document.createElement("button");
    activate.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
    activate.textContent = getItem("activeRoutineId") === r.id ? "Activa" : "Activar";
    on(activate, "click", () => { setItem("activeRoutineId", r.id); renderRoutines(); });
    const edit = document.createElement("button");
    edit.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
    edit.textContent = "Editar";
    on(edit, "click", () => loadRoutine(r.id));
    const dup = document.createElement("button");
    dup.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
    dup.textContent = "Duplicar";
    on(dup, "click", () => duplicateRoutine(r.id));
    const del = document.createElement("button");
    del.className = "px-2 py-1 text-sm rounded-md border border-slate-200 dark:border-slate-700";
    del.textContent = "Eliminar";
    on(del, "click", () => deleteRoutine(r.id));
    actions.appendChild(activate);
    actions.appendChild(edit);
    actions.appendChild(dup);
    actions.appendChild(del);
    head.appendChild(title);
    head.appendChild(actions);
    const daysWrap = document.createElement("div");
    daysWrap.className = "grid grid-cols-2 gap-2 text-sm";
    days.forEach(k => {
      const line = document.createElement("div");
      line.className = "flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900/40";
      const name = document.createElement("span");
      name.textContent = dayName[k];
      const count = document.createElement("span");
      count.className = "opacity-70";
      count.textContent = (r.days?.[k] || []).length + " eventos";
      line.appendChild(name);
      line.appendChild(count);
      daysWrap.appendChild(line);
    });
    card.appendChild(head);
    card.appendChild(daysWrap);
    wrap.appendChild(card);
  });
};

const loadRoutine = (id) => {
  const list = getItem("routines") || [];
  const r = list.find(x => x.id === id);
  if (!r) return;
  state.editingId = id;
  state.buffer = JSON.parse(JSON.stringify(r));
  qs("#routineName").value = r.name;
  renderDayEvents();
};

const duplicateRoutine = (id) => {
  const list = getItem("routines") || [];
  const r = list.find(x => x.id === id);
  if (!r) return;
  const copy = { ...JSON.parse(JSON.stringify(r)), id: uid("r_"), name: r.name + " (copia)" };
  setItem("routines", [...list, copy]);
  renderRoutines();
};

const deleteRoutine = (id) => {
  const list = getItem("routines") || [];
  const filtered = list.filter(x => x.id !== id);
  setItem("routines", filtered);
  if (getItem("activeRoutineId") === id) setItem("activeRoutineId", "");
  if (state.editingId === id) { state.editingId = ""; state.buffer = null; qs("#routineName").value = ""; qs("#dayEvents").innerHTML = ""; }
  renderRoutines();
};

const wireEditor = () => {
  // Prevenir envío del formulario
  const form = qs("#routineForm");
  if (form) {
    on(form, "submit", (e) => {
      e.preventDefault();
      return false;
    });
  }
  
  on(qs("#newRoutineBtn"), "click", () => { state.editingId = ""; state.buffer = emptyRoutine(); state.editingEventId = ""; qs("#routineName").value = ""; const btn = qs("#addEventBtn"); if (btn) btn.textContent = "Agregar evento"; renderDayEvents(); });
  on(qs("#addEventBtn"), "click", addEventToBuffer);
  on(qs("#saveRoutineBtn"), "click", saveRoutine);
  on(qs("#routineDay"), "change", () => { state.editingEventId = ""; const btn = qs("#addEventBtn"); if (btn) btn.textContent = "Agregar evento"; renderDayEvents(); });
  on(qs("#exportRoutines"), "click", exportJSON);
  on(qs("#importRoutines"), "change", importJSON);
  const settingsBtn = qs("#settingsBtn");
  const modal = qs("#settingsModal");
  const closeBtn = qs("#settingsClose");
  const saveSettings = qs("#saveSettings");
  const askNotifyPerm = qs("#askNotifyPerm");
  const ns = getItem("notifyBeforeStart") ?? 10;
  const ne = getItem("notifyBeforeEnd") ?? 5;
  if (qs("#notifyBeforeStart")) qs("#notifyBeforeStart").value = ns;
  if (qs("#notifyBeforeEnd")) qs("#notifyBeforeEnd").value = ne;
  on(settingsBtn, "click", () => { if (modal) { modal.classList.remove("hidden"); modal.classList.add("flex"); } });
  on(closeBtn, "click", () => { if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); } });
  on(saveSettings, "click", () => {
    const v1 = Number(qs("#notifyBeforeStart").value || 10);
    const v2 = Number(qs("#notifyBeforeEnd").value || 5);
    setItem("notifyBeforeStart", Math.max(0, v1));
    setItem("notifyBeforeEnd", Math.max(0, v2));
    if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); }
  });
  on(askNotifyPerm, "click", async () => {
    try { await Notification.requestPermission(); } catch { }
  });
};

const exportJSON = () => {
  const data = { routines: getItem("routines") || [], activeRoutineId: getItem("activeRoutineId") || "" };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "agendasmart-routines.json";
  a.click();
};

const importJSON = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data.routines)) setItem("routines", data.routines);
    if (typeof data.activeRoutineId === "string") setItem("activeRoutineId", data.activeRoutineId);
    renderRoutines();
  } catch { }
};

document.addEventListener("DOMContentLoaded", initPage);
