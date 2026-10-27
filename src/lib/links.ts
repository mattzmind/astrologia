export const whatsappUrl = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const instagramDmUrl = (handle: string) => `https://ig.me/m/${handle}`;

export const instagramProfileUrl = (handle: string) => `https://www.instagram.com/${handle}/`;

export const calPageUrl = (calLink: string) => `https://cal.com/${calLink}`;

export const mailtoUrl = (email: string) => `mailto:${email}`;
