export const locales = ['ko', 'en', 'ja', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';
