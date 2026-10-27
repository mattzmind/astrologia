import { t, type Locale } from '../i18n';
import { calPageUrl, instagramDmUrl, instagramProfileUrl, mailtoUrl, whatsappUrl } from './links';
import { isFilled } from './placeholder';
import { settings } from './settings';

/** Cal.com link for a locale (English falls back to Portuguese), or undefined while unfilled. */
export function calLinkFor(locale: Locale): string | undefined {
  const link = settings.calLink[locale] ?? settings.calLink['pt-BR'];
  return isFilled(link) ? link : undefined;
}

export function calPageFor(locale: Locale): string | undefined {
  const link = calLinkFor(locale);
  return link && calPageUrl(link);
}

/** Contact links; a link is left out while its setting is still a placeholder. */
export function contactLinks(locale: Locale) {
  const { instagramHandle, whatsappNumber, contactEmail } = settings;
  return {
    whatsapp: isFilled(whatsappNumber) ? whatsappUrl(whatsappNumber, t(locale).contact.whatsappGreeting) : undefined,
    instagramDm: isFilled(instagramHandle) ? instagramDmUrl(instagramHandle) : undefined,
    instagramProfile: isFilled(instagramHandle) ? instagramProfileUrl(instagramHandle) : undefined,
    email: isFilled(contactEmail) ? { address: contactEmail, href: mailtoUrl(contactEmail) } : undefined,
  };
}
