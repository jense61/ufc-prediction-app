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
  const isNumbered = /^UFC\s+\d+(\s*:.+)?$/.test(normalized);
  const isFreedom = /^UFC\s+FREEDOM(\s|:|$)/.test(normalized);

  return isNumbered || isFreedom;

};