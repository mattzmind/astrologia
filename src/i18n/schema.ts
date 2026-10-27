import { z } from 'zod';
import { PLACEHOLDER_MARKER } from '../lib/placeholder';

// Strict objects: a misspelled or extra key in a content file fails the build.
const obj = z.strictObject;
const str = z.string();
const page = obj({ title: str.min(1), description: str.min(1) });

export const siteContentSchema = obj({
  language: obj({ code: str, name: str, short: str, ogLocale: str }),
  routes: obj({
    home: z.literal(''),
    about: str.regex(/^[a-z0-9-]+$/),
    contact: str.regex(/^[a-z0-9-]+$/),
    privacy: str.regex(/^[a-z0-9-]+$/),
    bookingAnchor: str.regex(/^[a-z0-9-]+$/),
  }),
  meta: obj({
    siteName: str,
    tagline: str,
    ogImageAlt: str,
    pages: obj({ home: page, about: page, contact: page, privacy: page, notFound: page }),
  }),
  a11y: obj({
    skipLink: str,
    mainNav: str,
    languageNav: str,
    footerNav: str,
    newTab: str,
    switchLanguage: str,
  }),
  nav: obj({ home: str, about: str, contact: str }),
  ui: obj({
    book: str,
    whatsapp: str,
    openCalendar: str,
    calendarLoading: str,
    calendarFallbackHint: str,
    calendarMissing: str,
    previewBanner: str,
  }),
  home: obj({
    hero: obj({ eyebrow: str, title: str, subtitle: str, photoAlt: str }),
    howItWorks: obj({ title: str, steps: z.array(obj({ title: str, text: str })) }),
    session: obj({
      title: str,
      name: str,
      details: z.array(str),
      turnaroundLabel: str,
      turnaround: str,
      priceLabel: str,
      price: str,
    }),
    booking: obj({ title: str, intro: str }),
    testimonials: obj({ title: str, items: z.array(obj({ quote: str, author: str })) }),
    faq: obj({ title: str, items: z.array(obj({ question: str, answer: str })) }),
    closing: obj({ title: str, text: str }),
  }),
  about: obj({
    title: str,
    lead: str,
    paragraphs: z.array(str),
    photoAlts: z.array(str),
    approachTitle: str,
    approach: z.array(str),
    closingTitle: str,
    closingText: str,
  }),
  contact: obj({
    title: str,
    intro: str,
    replyTime: str,
    whatsappLabel: str,
    whatsappGreeting: str,
    instagramLabel: str,
    instagramProfileLabel: str,
    bookLabel: str,
  }),
  privacy: obj({
    title: str,
    intro: str,
    updatedLabel: str,
    updatedAt: z.iso.date(),
    sections: z.array(obj({ heading: str, body: str })),
    rights: obj({ heading: str, body: str, emailCta: str }),
  }),
  notFound: obj({ title: str, text: str, back: str }),
  footer: obj({
    disclaimer: str,
    privacyLink: str,
    instagramLabel: str,
    whatsappLabel: str,
    copyright: str,
  }),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

/** A real value matching `pattern`, or a [[PREENCHER]] placeholder. */
const fillable = (real: z.ZodType<string>) => z.union([str.startsWith(PLACEHOLDER_MARKER), real]);
const calLink = fillable(str.regex(/^[\w.-]+\/[\w.-]+$/, 'use o formato usuario/evento, sem https://cal.com/'));

export const settingsSchema = obj({
  siteUrl: z.url(),
  enabledLocales: z.array(z.enum(['pt-BR', 'en'])).min(1),
  calLink: obj({ 'pt-BR': calLink, en: calLink.optional() }),
  instagramHandle: fillable(str.regex(/^[A-Za-z0-9._]{1,30}$/, 'só o usuário, sem @')),
  whatsappNumber: fillable(str.regex(/^\d{10,15}$/, 'só números, com DDI e DDD')),
  contactEmail: fillable(z.email()),
  analyticsToken: str,
  photos: obj({ hero: str, about: z.array(str) }),
});
export type Settings = z.infer<typeof settingsSchema>;

export function parseOrExplain<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(`${label} inválido:\n${z.prettifyError(result.error)}`);
  return result.data;
}
