import { createInterface } from 'node:readline/promises';
import { hashPassword } from '../src/lib/password.ts';

const rl = createInterface({ input: process.stdin, output: process.stderr });
const password = await rl.question('password: ');
rl.close();

process.stdout.write(`${await hashPassword(password)}\n`);
