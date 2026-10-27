// Preview mode shows [[PREENCHER]] placeholders instead of hiding them.
// On: `astro dev`, SHOW_PLACEHOLDERS=1, or a Cloudflare Pages preview branch (anything but main).
// No imports: this file is also loaded directly by Node from scripts/.

type Env = Record<string, string | undefined>;

export function isPreviewMode(env: Env = process.env, dev: boolean = import.meta.env?.DEV ?? false): boolean {
  if (dev || env.SHOW_PLACEHOLDERS === '1') return true;
  const branch = env.CF_PAGES_BRANCH;
  return Boolean(branch) && branch !== 'main';
}

/** Production launch: the build must fail if required settings are still placeholders. */
export function isLaunchBuild(env: Env = process.env): boolean {
  return env.CF_PAGES_BRANCH === 'main' || env.LAUNCH === '1';
}
