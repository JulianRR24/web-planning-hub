export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
export const on = (el, ev, fn) => { if (!el) return; el.addEventListener(ev, fn); };
export const uid = (p = "id") => p + Math.random().toString(36).slice(2, 10);
export const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const dayName = { mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo" };
export const todayKey = () => {
    const d = new Date();
    const i = d.getDay();
    if (i === 0) return "sun";
    if (i === 1) return "mon";
    if (i === 2) return "tue";
    if (i === 3) return "wed";
    if (i === 4) return "thu";
    if (i === 5) return "fri";
    return "sat";
};
export const hhmmToMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};
export const minutesToTop = (min) => Math.round(min * (1536 / 1440));
