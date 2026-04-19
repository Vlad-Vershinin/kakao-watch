type DateTimeInput = Date | string | number;


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

/**
 * Склоняет единицу измерения времени
 */
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

/**
 * Конвертирует дату в человекочитаемый формат относительно текущего момента
 */
export function formatRelativeTime(date: DateTimeInput): string {
    const targetDate = new Date(date);
    const now = new Date();
    
    // Проверка валидности даты
    if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date provided');
    }

    const diffMs = now.getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Будущее время
    if (diffMs < 0) {
        const futureDiff = Math.abs(diffMs);
        const futureSeconds = Math.floor(futureDiff / 1000);
        
        if (futureSeconds < 60) {
            return `через ${formatTimeUnit(futureSeconds, 'second')}`;
        }
        
        const futureMinutes = Math.floor(futureSeconds / 60);
        if (futureMinutes < 60) {
            return `через ${formatTimeUnit(futureMinutes, 'minute')}`;
        }
        
        const futureHours = Math.floor(futureMinutes / 60);
        if (futureHours < 24) {
            return `через ${formatTimeUnit(futureHours, 'hour')}`;
        }
        
        const futureDays = Math.floor(futureHours / 24);
        if (futureDays < 7) {
            return `через ${formatTimeUnit(futureDays, 'day')}`;
        }
        
        const futureWeeks = Math.floor(futureDays / 7);
        if (futureWeeks < 5) {
            return `через ${formatTimeUnit(futureWeeks, 'week')}`;
        }
        
        const futureMonths = Math.floor(futureDays / 30);
        if (futureMonths < 12) {
            return `через ${formatTimeUnit(futureMonths, 'month')}`;
        }
        
        const futureYears = Math.floor(futureDays / 365);
        return `через ${formatTimeUnit(futureYears, 'year')}`;
    }

    // Настоящее / прошлое время
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


