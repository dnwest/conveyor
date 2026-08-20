import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const SCHEME = 'scrypt';
// ':' rather than the conventional '$': the hash lives in a .env file, and
// dotenv expands '$name' sequences before the value ever reaches us.
const FIELD_SEPARATOR = ':';
const KEY_LENGTH = 64;
const COST = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(normalize(password), salt, KEY_LENGTH, COST);
  return [SCHEME, COST.N, COST.r, COST.p, salt.toString('base64'), key.toString('base64')].join(
    FIELD_SEPARATOR,
  );
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parse(stored);
  if (!parsed) return false;

  const key = await derive(normalize(password), parsed.salt, parsed.expected.length, parsed.cost);

  return timingSafeEqual(key, parsed.expected);
}

function derive(
  password: string,
  salt: Buffer,
  keyLength: number,
  cost: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, cost, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

function parse(stored: string) {
  const [scheme, n, r, p, salt, hash] = stored.split(FIELD_SEPARATOR);
  if (scheme !== SCHEME || !salt || !hash) return null;

  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (Object.values(cost).some((value) => !Number.isInteger(value) || value <= 0)) return null;

  const expected = Buffer.from(hash, 'base64');
  if (expected.length === 0) return null;

  return { cost, salt: Buffer.from(salt, 'base64'), expected };
}

// Two visually identical passwords can carry different Unicode code points;
// normalizing keeps the derived key stable across clients.
function normalize(password: string): string {
  return password.normalize('NFKC');
}
