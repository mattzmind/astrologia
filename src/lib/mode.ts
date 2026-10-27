// Preview mode shows [[PREENCHER]] placeholders instead of hiding them.
// On: `astro dev`, SHOW_PLACEHOLDERS=1, or a Cloudflare preview build (any branch but main).
// Cloudflare Workers Builds sets WORKERS_CI_BRANCH; Cloudflare Pages sets CF_PAGES_BRANCH.
// No imports: this file is also loaded directly by Node from scripts/.

type Env = Record<string, string | undefined>;

export const PRODUCTION_BRANCH = 'main';

const ciBranch = (env: Env) => env.WORKERS_CI_BRANCH || env.CF_PAGES_BRANCH;

export function isPreviewMode(env: Env = process.env, dev: boolean = import.meta.env?.DEV ?? false): boolean {
  if (dev || env.SHOW_PLACEHOLDERS === '1') return true;
  const branch = ciBranch(env);
  return Boolean(branch) && branch !== PRODUCTION_BRANCH;
}

/**
 * Launch build: fails if required settings are still placeholders.
 * Opt-in with LAUNCH=1 (set it in Cloudflare's build variables when the real domain goes live),
 * so pre-launch deploys of main keep working while Gabby's accounts are being set up.
 */
export function isLaunchBuild(env: Env = process.env): boolean {
  return env.LAUNCH === '1';
}
