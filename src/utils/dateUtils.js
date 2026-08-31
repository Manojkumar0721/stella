// Helper utilities for date & month calculations dynamically based on custom date ranges

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Format year, month (0-indexed), and day to YYYY-MM-DD string
 */
export const formatDateString = (year, month, day) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

/**
 * Format YYYY-MM-DD string into friendly format e.g. "Tuesday, September 1, 2026"
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Dynamically calculate all months that fall between startDateStr and endDateStr
 * Returns array of objects: [{ year, month, name, shortName, daysCount }, ...]
 */
export const getMonthsInRange = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return [];

  const [startYear, startMonth] = startDateStr.split('-').map(Number);
  const [endYear, endMonth] = endDateStr.split('-').map(Number);

  const months = [];
  let currYear = startYear;
  let currMonth = startMonth - 1; // 0-indexed for Date

  const targetYear = endYear;
  const targetMonth = endMonth - 1;

  while (currYear < targetYear || (currYear === targetYear && currMonth <= targetMonth)) {
    const dateObj = new Date(currYear, currMonth, 1);
    const name = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const shortName = dateObj.toLocaleDateString("en-US", { month: "short" });
    const daysCount = new Date(currYear, currMonth + 1, 0).getDate();

    months.push({
      year: currYear,
      month: currMonth,
      name,
      shortName,
      daysCount
    });

    currMonth++;
    if (currMonth > 11) {
      currMonth = 0;
      currYear++;
    }
  }

  return months;
};

/**
 * Check if a date string falls strictly between startDateStr and endDateStr inclusive
 */
export const isDateInRange = (dateStr, startDateStr, endDateStr) => {
  if (!dateStr || !startDateStr || !endDateStr) return false;
  return dateStr >= startDateStr && dateStr <= endDateStr;
};

/**
 * Get grid structure for a month including padding blank cells before day 1
 */
export const getMonthGridDays = (year, monthIndex) => {
  // First day of month
  const firstDay = new Date(year, monthIndex, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon, ...
  
  // Total days in month
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  
  const grid = [];
  
  // Padding cells before start of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    grid.push(null);
  }
  
  // Days of month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDateString(year, monthIndex, day);
    grid.push({
      dayNumber: day,
      dateStr,
      year,
      month: monthIndex,
      dayOfWeek: new Date(year, monthIndex, day).getDay()
    });
  }
  
  return grid;
};

/**
 * Get previous and next valid date within challenge date bounds
 */
export const getAdjacentDates = (dateStr, startDateStr, endDateStr) => {
  if (!dateStr) return { prev: null, next: null };
  const [y, m, d] = dateStr.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  
  const prevDate = new Date(current);
  prevDate.setDate(prevDate.getDate() - 1);
  
  const nextDate = new Date(current);
  nextDate.setDate(nextDate.getDate() + 1);

  const prevStr = formatDateString(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
  const nextStr = formatDateString(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());

  const prevValid = isDateInRange(prevStr, startDateStr, endDateStr) ? prevStr : null;
  const nextValid = isDateInRange(nextStr, startDateStr, endDateStr) ? nextStr : null;
  
  return { prev: prevValid, next: nextValid };
};

/**
 * Check if a date string is today (for visual highlight)
 */
export const isTodayDate = (dateStr) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  return dateStr === formatDateString(year, month, day);
};
