/**
 * Format date object to API format (yyyy-MM-dd)
 */
export const formatDateForAPI = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

/**
 * Format date string to display format (dd/MM/yyyy)
 * Handles both yyyy-MM-dd and dd/MM/yyyy input formats
 */
export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return "";

  // If format is yyyy-MM-dd
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  // If format is dd/MM/yyyy
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

export const formatDateTimeForDisplay = (dateString: string): string => {
  if (!dateString) return "-";
  
  // Handle both full ISO string and date-only string
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatTimeForDisplay = (dateString: string): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Convert date from dd/MM/yyyy to yyyy-MM-dd format
 */
export const convertToAPIDateFormat = (dateStr: string): string => {
  if (!dateStr) return "";

  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;

  let [day, month, year] = parts;
  if (day.length === 1) day = "0" + day;
  if (month.length === 1) month = "0" + month;

  return `${year}-${month}-${day}`;
};

export const formatDateTimetoAPIFormat = (dateStr: string): string => {
  const date = new Date(dateStr);
  // Lấy ngày, tháng, năm theo giờ Việt Nam
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en', options).formatToParts(date);
  
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  const month = parts.find(p => p.type === 'month')?.value ?? '01';
  const year = parts.find(p => p.type === 'year')?.value ?? '1970';

  return `${year}-${month}-${day}`;
};
