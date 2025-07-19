export function formatDate(date, seperator = '/')
{
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2,"0");
    const month = String(d.getMonth() + 1).padStart(2,"0");
    const year = String(d.getFullYear());
    const hour = String(d.getHours()).padStart(2,"0");
    const minute = String(d.getMinutes()).padStart(2,"0");
    return `${month}${seperator}${day}${seperator}${year}  ${hour}:${minute}`;
}



export function toLocalDatetimeString(dateInput) {
    const d = new Date(dateInput);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); 
    return d.toISOString().slice(0, 16);//YYYY-MM-DDTHH:mm:ss.sssZ 
}