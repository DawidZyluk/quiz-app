import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale: string = routing.defaultLocale; // Initialize with default to ensure it's always a string

    const requested = await requestLocale; // Get the requested locale

    // If a locale was requested and it's one of our valid locales, use it.
    // We can safely cast `requested` to `string` here because `routing.locales.includes`
    // expects a string, and if `requested` is not undefined, it should be a string.
    if (requested && routing.locales.includes(requested)) {
        locale = requested;
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
