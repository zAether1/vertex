import fs from 'fs';
import path from 'path';

try {
  const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) process.env[key] = value;
    }
  });
} catch (e) {
  // Ignored
}

import { beforeAll } from 'vitest';

beforeAll(() => {
  if (!process.env.DATABASE_URL_TEST) {
    console.warn('DATABASE_URL_TEST is not set. Real PostgreSQL integration tests will be skipped or will fail.');
  }
});