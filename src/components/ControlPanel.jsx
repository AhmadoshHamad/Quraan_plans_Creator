// components/ControlPanel.jsx
import React from 'react';
import chapters from '../chapters.json';

const ControlPanel = ({
  participantName,
  setParticipantName,
  currentMonth,
  handleMonthChange,
  currentYear,
  handleYearChange,
  selectedChapter,
  handleChapterChange,
  selectedPage,
  setSelectedPage,
  availablePages,
  advancedMenu,
  setAdvancedMenu
}) => {
  // Generate year options (current year -5 to +5)
  const currentYearNum = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYearNum - 5; i <= currentYearNum + 5; i++) {
    yearOptions.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
      {/* Participant Name Field */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <label className="font-medium">اسم المشترك/ة:</label>
        <input
          type="text"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          className="px-2 py-1 sm:px-3 sm:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          placeholder="أدخل اسم المشترك/ة"
        />
      </div>
      
      {/* Month/Year selectors */}
      <div className="flex flex-row gap-2 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
          <label className="font-medium">الشهر:</label>
          <select
            value={currentMonth}
            onChange={handleMonthChange}
            className="px-2 py-1 sm:px-3 sm:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value={0}>يناير</option>
            <option value={1}>فبراير</option>
            <option value={2}>مارس</option>
            <option value={3}>أبريل</option>
            <option value={4}>مايو</option>
            <option value={5}>يونيو</option>
            <option value={6}>يوليو</option>
            <option value={7}>أغسطس</option>
            <option value={8}>سبتمبر</option>
            <option value={9}>أكتوبر</option>
            <option value={10}>نوفمبر</option>
            <option value={11}>ديسمبر</option>
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
          <label className="font-medium">السنة:</label>
          <select
            value={currentYear}
            onChange={handleYearChange}
            className="px-2 py-1 sm:px-3 sm:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Chapter Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <label className="font-medium whitespace-nowrap">بداية الحفظ:</label>
        <div className="flex gap-2 flex-1">
          <select
            value={selectedChapter?.chapter_number || ""}
            onChange={handleChapterChange}
            className="px-2 py-1 sm:px-3 sm:py-2 border rounded flex-1"
          >
            <option value="">اختر سورة</option>
            {chapters.map(chapter => (
              <option key={chapter.chapter_number} value={chapter.chapter_number}>
                {chapter.chapter_name_arabic}
              </option>
            ))}
          </select>

          <select
            value={selectedPage || ""}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-2 py-1 sm:px-3 sm:py-2 border rounded flex-1"
            disabled={!selectedChapter}
          >
            {!selectedChapter && <option value="">اختر سورة أولاً</option>}
            {availablePages.map(page => (
              <option key={page} value={page}>ص {page}</option>
            ))}
          </select>
        </div>
        
        <button
          style={{ border: "1px solid black" }}
          className="w-full bg-transparent sm:w-auto flex justify-between items-center text-left font-medium hover:text-blue-800 mt-1 sm:mt-0"
          onClick={() => setAdvancedMenu(!advancedMenu)}
        >
          <span className="px-2">إعدادات متقدمة</span>
          <span>{advancedMenu ? '▲' : '▼'}</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;