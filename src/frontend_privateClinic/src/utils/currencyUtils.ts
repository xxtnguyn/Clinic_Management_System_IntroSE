/**
 * Format a number with thousand separators and remove decimal part if it's .00
 */
export const formatNumberWithThousandSeparator = (value: number | string): string => {
    const number = typeof value === "string" ? parseFloat(value) : value;
    return number.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
  };
  