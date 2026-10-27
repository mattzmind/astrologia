import fs from 'node:fs';
import path from 'node:path';
import bundled from '../content/settings.json';
import { parseOrExplain, settingsSchema, type Settings } from '../i18n/schema';

// SETTINGS_OVERRIDE points at another settings file; the test builds use it to fill in fake links.
function load(): Settings {
  const override = process.env.SETTINGS_OVERRIDE;
  const data: unknown = override ? JSON.parse(fs.readFileSync(path.resolve(override), 'utf8')) : bundled;
  return parseOrExplain(settingsSchema, data, override ?? 'src/content/settings.json');
}

export const settings = load();
