export function nowIso() {
  return new Date().toISOString();
}

export function dateLabel(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
