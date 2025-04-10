// components/AdvancedSettings.jsx
import React from 'react';

const AdvancedSettings = ({
  contentRef,
  advancedMenu,
  pagesPerDay,
  setPagesPerDay,
  startingDay,
  handleStartingDayChange,
  getDaysInMonth,
  currentMonth,
  currentYear,
  alternateDay,
  setAlternateDay,
  excludeWeekdays,
  setExcludeWeekdays
}) => {
  return (
    <div
      ref={contentRef}
      className="transition-all duration-500 ease-in-out overflow-hidden"
      style={{
        maxHeight: advancedMenu ? contentRef.current?.scrollHeight + 'px' : '0px',
      }}
    >
      <div className="mt-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 w-full">
          <div className="flex items-center">
            <label className="text-sm sm:text-md font-bold mb-0 sm:mb-2 ml-2 sm:ml-3 whitespace-nowrap">عدد الصفحات/ يوم</label>
            <input 
              type="number" 
              className="w-10 p-1 border rounded"
              value={pagesPerDay}
              onChange={(e) => setPagesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm sm:text-md font-bold mb-0 sm:mb-2 ml-2 sm:ml-3 whitespace-nowrap">يوم البداية:</label>
            <input 
              type="number" 
              className="w-16 p-1 border rounded"
              value={startingDay}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                const maxDays = getDaysInMonth(currentMonth, currentYear);
                const validDay = Math.min(Math.max(1, value), maxDays);
                handleStartingDayChange({ target: { value: validDay } });
              }}
              min="1"
              max={getDaysInMonth(currentMonth, currentYear)}
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              className="ml-2 w-5 h-5 sm:w-7 sm:h-7" 
              checked={alternateDay}
              onChange={(e) => setAlternateDay(e.target.checked)} 
            />
            <label className="text-sm sm:text-md font-bold whitespace-nowrap">صفحة يوم بعد يوم</label>
          </div>
        </div>
        
        <label className="block text-md sm:text-lg font-bold">إستثناء أيام محددة:</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-0 w-full sm:w-3/4">
          {Object.keys(excludeWeekdays).map(day => (
            <div key={day} className="flex items-center">
              <input 
                id={`Exclude${day}`}
                type="checkbox" 
                className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
                checked={excludeWeekdays[day]}
                onChange={(e) => setExcludeWeekdays(prev => ({...prev, [day]: e.target.checked}))} 
              />
              <label htmlFor={`Exclude${day}`} className="text-sm sm:text-base">استثناء يوم {day}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;