export const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z\s'-]/g, "")
    .trim();

export const normalizeEventName = (value: string) =>
  value
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

export const isNumberedUfcEvent = (value: string) => {
  const normalized = normalizeEventName(value);
  return /^UFC\s+\d+$/.test(normalized);
};