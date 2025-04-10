// dateUtils.js - Utilities for date operations

/**
 * Returns the number of days in a given month and year
 * @param {number} month Month (0-11)
 * @param {number} year Year (e.g. 2025)
 * @returns {number} Number of days in the month
 */
export const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  /**
   * Generates table rows for a specific month starting from a specific day
   * @param {number} month Month (0-11)
   * @param {number} year Year (e.g. 2025)
   * @param {number} startingDay Day of the month to start from (1-31)
   * @returns {Array} Array of row data for the table
   */
  export const generateMonthRowsWithDay = (month, year, startingDay) => {
    const daysInMonth = getDaysInMonth(month, year);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    // Create header row with Arabic columns (right to left)
    const newRows = [
      ["اليوم", "التاريخ", "الحفظ", "المراجعة", "نوع التسميع"]
    ];
    
    // Create a row for each day starting from the provided day to the end of the month
    for (let i = startingDay; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayName = days[date.getDay()];
      const dateStr = `${i}/${month + 1}`; // Month is 0-indexed, so add 1
      newRows.push([dayName, dateStr, "", "", ""]);
    }
    
    return newRows;
  };