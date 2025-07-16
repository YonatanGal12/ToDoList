export function formatDate(date, seperator = '/')
{
    const d = new Date(date);

    const year = String(d.getDate()).padStart(2,"0");
    const month = String(d.getMonth()).padStart(2,"0");
    const day = String(d.getFullYear());
    const hour = String(d.getHours());
    const minute = String(d.getMinutes());
    return `${day}${seperator}${month}${seperator}${year}  ${hour}:${minute}`;
}