// PlansCreator.jsx Page
import React from "react";
import { useState, useEffect, useRef } from "react";
import { saveAs } from "file-saver";
import chapters from "./../chapters.json";

// Component imports
import ControlPanel from "./../components/ControlPanel";
import AdvancedSettings from "./../components/AdvancedSettings";
import TablePanel from "./../components/TablePanel";
import PdfPreview from "./../components/PdfPreview";

// Utility imports
import { generateDoc, generatePDF } from "./../utils/documentGenerators";
import { getDaysInMonth, generateMonthRowsWithDay } from "./../utils/dateUtils";

const StakeholderEditor = () => {
  // ========== STATE MANAGEMENT ==========
  // User inputs
  const [participantName, setParticipantName] = useState("محمد عبدالعظيم ابو نبعة");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [startingDay, setStartingDay] = useState(1);
  
  // Plan configuration
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [availablePages, setAvailablePages] = useState([]);
  const [pagesPerDay, setPagesPerDay] = useState(1);
  const [alternateDay, setAlternateDay] = useState(false);
  const [excludeWeekdays, setExcludeWeekdays] = useState({
    "الأحد": false,
    "الإثنين": false,
    "الثلاثاء": false,
    "الأربعاء": false,
    "الخميس": false,
    "الجمعة": false,
    "السبت": false,
  });
  
  // Table data
  const [rows, setRows] = useState([]);
  
  // UI state
  const [advancedMenu, setAdvancedMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Document state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [watermarkUrl] = useState("/watermark.png");
  const [watermarkImageData, setWatermarkImageData] = useState(null);
  
  // Refs
  const debounceTimer = useRef(null);
  const contentRef = useRef(null);
  const pdfObjectRef = useRef(null);

  // ========== EVENT HANDLERS ==========
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setCurrentMonth(newMonth);
    generateMonthRows(newMonth, currentYear);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setCurrentYear(newYear);
    generateMonthRows(currentMonth, newYear);
  };

  const handleStartingDayChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const maxDays = getDaysInMonth(currentMonth, currentYear);
    const validDay = Math.min(Math.max(1, value), maxDays);
    
    setStartingDay(validDay);
    const updatedRows = generateMonthRowsWithDay(currentMonth, currentYear, validDay);
    setRows(updatedRows);
  };

  const handleChapterChange = (e) => {
    const chapter = chapters.find(c => c.chapter_number === parseInt(e.target.value));
    setSelectedChapter(chapter);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const updated = rows.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell)) : row
    );
    setRows(updated);
  };

  // ========== DOCUMENT OPERATIONS ==========
  const downloadDocx = async () => {
    try {
      setLoading(true);
      const blob = await generateDoc(rows, participantName, currentMonth, currentYear);
      saveAs(blob, `خطة_الحفظ_${participantName}_${currentMonth}_${currentYear}.docx`);
      setLoading(false);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      setLoading(false);
      alert("حدث خطأ أثناء إنشاء ملف DOCX. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.");
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      const blob = await generatePDF(rows, participantName, currentMonth, watermarkImageData);
      saveAs(blob, `خطة_الحفظ_${participantName}_${currentMonth}_${currentYear}.pdf`);
      setLoading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setLoading(false);
      alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.");
    }
  };

  // ========== EFFECT HOOKS ==========
  // Load watermark image on component mount
  useEffect(() => {
    const loadWatermarkImage = async () => {
      try {
        const response = await fetch(watermarkUrl);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = () => {
          setWatermarkImageData(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading watermark image:", error);
      }
    };
    
    loadWatermarkImage();
  }, [watermarkUrl]);

  // React to changes in startingDay
  useEffect(() => {
    generateMonthRows(currentMonth, currentYear);
  }, [startingDay, currentMonth, currentYear]);

  // Update available pages when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      const pages = [];
      for (let i = selectedChapter.starting_page; i <= selectedChapter.ending_page; i++) {
        pages.push(i);
      }
      setAvailablePages(pages);
      setSelectedPage(pages[0]);
    }
  }, [selectedChapter]);

  // Main effect for updating table content based on selections
  useEffect(() => {
    if (selectedChapter && selectedPage && rows.length > 1) {
      updateTableWithStudyPlan();
    }
  }, [selectedPage, selectedChapter, rows.length, excludeWeekdays, pagesPerDay, alternateDay, startingDay, currentMonth, currentYear]);

  // Update PDF preview when rows, participant name, or watermark changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      updatePdfPreview();
    }, 800);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [rows, participantName, watermarkImageData, currentMonth, currentYear]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // ========== HELPER FUNCTIONS ==========
  const generateMonthRows = (month, year) => {
    const newRows = generateMonthRowsWithDay(month, year, startingDay);
    setRows(newRows);
  };

  const updateTableWithStudyPlan = () => {
    const updatedRows = [...rows];
    let currentPage = parseInt(selectedPage);
    let currentChapter = selectedChapter;
    let chapterIndex = chapters.findIndex(c => c.chapter_number === currentChapter.chapter_number);
    
    for (let i = 1; i < updatedRows.length; i++) {
      const dayName = updatedRows[i][0]; // Get the day name from the row
      
      // Skip this day if it's excluded
      if (excludeWeekdays[dayName]) {
        updatedRows[i][2] = ""; // Clear the الحفظ column for excluded days
        continue;
      }
      
      // Skip alternate days if the option is enabled
      if (alternateDay && i % 2 === 0) {
        updatedRows[i][2] = ""; // Clear the الحفظ column for alternate days
        continue;
      }
      
      // Calculate ending page for this day based on pagesPerDay
      let endPage = currentPage + pagesPerDay - 1;
      let pageRange = "";
      
      // Check if we're still in the same chapter
      if (endPage <= currentChapter.ending_page) {
        // Same chapter
        if (pagesPerDay === 1) {
          pageRange = `${currentChapter.chapter_name_arabic} ${currentPage}`;
        } else {
          pageRange = `${currentChapter.chapter_name_arabic} ${currentPage}-${endPage}`;
        }
        currentPage = endPage + 1;
      } else {
        // We need to span across chapters
        let remainingPages = pagesPerDay;
        let pageSegments = [];
        
        // Add pages from current chapter
        let pagesFromCurrentChapter = currentChapter.ending_page - currentPage + 1;
        if (pagesFromCurrentChapter > 0) {
          if (pagesFromCurrentChapter === 1) {
            pageSegments.push(`${currentChapter.chapter_name_arabic} ${currentPage}`);
          } else {
            pageSegments.push(`${currentChapter.chapter_name_arabic} ${currentPage}-${currentChapter.ending_page}`);
          }
          remainingPages -= pagesFromCurrentChapter;
        }
        
        // If we need more pages, move to next chapter(s)
        while (remainingPages > 0 && chapterIndex + 1 < chapters.length) {
          chapterIndex++;
          currentChapter = chapters[chapterIndex];
          currentPage = currentChapter.starting_page;
          
          let pagesToTake = Math.min(remainingPages, currentChapter.ending_page - currentChapter.starting_page + 1);
          endPage = currentPage + pagesToTake - 1;
          
          if (pagesToTake === 1) {
            pageSegments.push(`${currentChapter.chapter_name_arabic} ${currentPage}`);
          } else {
            pageSegments.push(`${currentChapter.chapter_name_arabic} ${currentPage}-${endPage}`);
          }
          
          remainingPages -= pagesToTake;
          currentPage = endPage + 1;
        }
        
        pageRange = pageSegments.join(" + ");
      }
      
      updatedRows[i][2] = pageRange;
    }
    
    setRows(updatedRows);
  };

  const updatePdfPreview = async () => {
    try {
      const blob = await generatePDF(rows, participantName, currentMonth, watermarkImageData);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setLoading(false);
    }
  };

  // ========== RENDER ==========
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" dir="rtl">
      {/* Top Panel - Control inputs */}
      <div className="p-2 sm:p-4 bg-gray-100 border-b">
        <ControlPanel
          participantName={participantName}
          setParticipantName={setParticipantName}
          currentMonth={currentMonth}
          handleMonthChange={handleMonthChange}
          currentYear={currentYear}
          handleYearChange={handleYearChange}
          selectedChapter={selectedChapter}
          handleChapterChange={handleChapterChange}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          availablePages={availablePages}
          advancedMenu={advancedMenu}
          setAdvancedMenu={setAdvancedMenu}
        />
        
        <AdvancedSettings
          contentRef={contentRef}
          advancedMenu={advancedMenu}
          pagesPerDay={pagesPerDay}
          setPagesPerDay={setPagesPerDay}
          startingDay={startingDay}
          handleStartingDayChange={handleStartingDayChange}
          getDaysInMonth={getDaysInMonth}
          currentMonth={currentMonth}
          currentYear={currentYear}
          alternateDay={alternateDay}
          setAlternateDay={setAlternateDay}
          excludeWeekdays={excludeWeekdays}
          setExcludeWeekdays={setExcludeWeekdays}
        />
      </div>
      
      {/* Main Content - Table and PDF Preview */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
        <TablePanel
          rows={rows}
          updateCell={updateCell}
          downloadDocx={downloadDocx}
          downloadPDF={downloadPDF}
          loading={loading}
        />
        
        <PdfPreview
          pdfUrl={pdfUrl}
          loading={loading}
          pdfObjectRef={pdfObjectRef}
        />
      </div>
    </div>
  );
};

export default StakeholderEditor;