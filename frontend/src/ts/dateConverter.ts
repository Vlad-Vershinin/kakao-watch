function pluralize(
    count: number, 
    forms: [string, string, string]
): string {
    const absCount = Math.abs(count);
    const mod10 = absCount % 10;
    const mod100 = absCount % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return forms[0];
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return forms[1];
    }
    return forms[2];
}

function formatTimeUnit(value: number, unit: string): string {
    const forms: Record<string, [string, string, string]> = {
        second: ['секунду', 'секунды', 'секунд'],
        minute: ['минуту', 'минуты', 'минут'],
        hour: ['час', 'часа', 'часов'],
        day: ['день', 'дня', 'дней'],
        week: ['неделю', 'недели', 'недель'],
        month: ['месяц', 'месяца', 'месяцев'],
        year: ['год', 'года', 'лет']
    };

    const unitForms = forms[unit];
    if (!unitForms) return `${value} ${unit}`;

    return `${value} ${pluralize(value, unitForms)}`;
}

export function formatRelativeTime(dateInput: Date | string | number): string {
    const targetDate = new Date(dateInput);
    
    if (isNaN(targetDate.getTime())) {
        console.error('Invalid date provided:', dateInput);
        return 'недавно';
    }

    const diffMs = new Date().getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 5) {
        return 'сейчас';
    }
    
    if (diffSeconds < 60) {
        return `${formatTimeUnit(diffSeconds, 'second')} назад`;
    }
    
    if (diffMinutes < 60) {
        return `${formatTimeUnit(diffMinutes, 'minute')} назад`;
    }
    
    if (diffHours < 24) {
        return `${formatTimeUnit(diffHours, 'hour')} назад`;
    }
    
    if (diffDays < 7) {
        return `${formatTimeUnit(diffDays, 'day')} назад`;
    }
    
    if (diffWeeks < 5) {
        return `${formatTimeUnit(diffWeeks, 'week')} назад`;
    }
    
    if (diffMonths < 12) {
        return `${formatTimeUnit(diffMonths, 'month')} назад`;
    }
    
    return `${formatTimeUnit(diffYears, 'year')} назад`;
}


