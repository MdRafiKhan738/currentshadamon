import { formatDistanceToNow, format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

export const timeAgo = (date: string | Date, language: 'en' | 'bn' = 'en') => {
    const d = new Date(date);
    const locale = language === 'bn' ? bn : enUS;

    const distance = formatDistanceToNow(d, { addSuffix: true, locale });

    // Custom replacements for Bengali to make it sound more natural if needed
    // The date-fns bn locale is usually good, but sometimes 'about' is translated loosely

    return distance;
};

export const formatDate = (date: string | Date, language: 'en' | 'bn' = 'en') => {
    const d = new Date(date);
    const locale = language === 'bn' ? bn : enUS;
    return format(d, 'PP', { locale });
};
