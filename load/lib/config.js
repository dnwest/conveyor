const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:3000';

export function url(path) {
  return `${BASE_URL}${path}`;
}

export function jsonParams(name) {
  return {
    headers: { 'Content-Type': 'application/json' },
    tags: { name },
  };
}

export function number(name, fallback) {
  const raw = __ENV[name];
  return raw === undefined ? fallback : Number(raw);
}

export function duration(name, fallback) {
  return __ENV[name] ?? fallback;
}
