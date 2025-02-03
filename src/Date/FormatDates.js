/**
 * Returns the date formatted according to the template.
 * @param {Date} date - The date that will be formatted
 * @param {String} template - The template that will be returned
 * @returns 
 */
export function formatDateToString(date, template) {
    const replacements = {
        '%year%': date.getFullYear(),
        '%month%': String(date.getMonth() + 1).padStart(2, '0'),
        '%day%': String(date.getDate()).padStart(2, '0'),
        '%hour%': String(date.getHours()).padStart(2, '0'),
        '%minute%': String(date.getMinutes()).padStart(2, '0'),
        '%second%': String(date.getSeconds()).padStart(2, '0'),
        '%millis%': String(date.getMilliseconds()).padStart(3, '0')
    };

    return template.replace(/%year%|%month%|%day%|%hour%|%minute%|%second%|%millis%/g, match => replacements[match]);
}

/**
 * Returns the date from the string.
 * @param {String} stringDate - The string that will be converted to date. It needs to be in the format 'YYYY-MM-DD HH:mm:ss.SSS'
 */
export function dateFromString(stringDate) {
    const [date, time] = stringDate.split(' ');
    const [year, month, day] = date.split('-');
    const [hour, minute, second] = time.split(':');
    const [seconds, milliseconds] = second.split('.');

    return new Date(year, month - 1, day, hour, minute, seconds, milliseconds);
}

