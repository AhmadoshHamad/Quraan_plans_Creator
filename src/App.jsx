import React, { useState, useEffect, useRef } from "react";
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  Header,
  ImageRun,
  AlignmentType,
  BorderStyle,
  TextRun
} from "docx";
import { saveAs } from "file-saver";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";  // Add this import
import chapters from "./chapters.json";



const StakeholderEditor = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [participantName, setParticipantName] = useState("محمد عبدالعظيم ابو نبعة");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watermarkUrl, setWatermarkUrl] = useState("/watermark.png");
  const [watermarkImageData, setWatermarkImageData] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [availablePages, setAvailablePages] = useState([]);
  const debounceTimer = useRef(null);
  const pdfObjectRef = useRef(null);

  // Advanced Collopased Menu
  const [pagesPerDay, setPagesPerDay] = useState(1);
  const [advancedMenu, setAdvancedMenu] = useState(false);
  const [alternateDay, setAlternateDay] = useState(false);
  const [startingDay, setStartingDay] = useState(1);
  const contentRef = useRef(null);
     // Eclude weekdays
  const [excludeWeekdays, setExcludeWeekdays] = useState({
    "الأحد": false,
    "الإثنين": false,
    "الثلاثاء": false,
    "الأربعاء": false,
    "الخميس": false,
    "الجمعة": false,
    "السبت": false,
  });


  // Load watermark image on component mount
  useEffect(() => {
    loadWatermarkImage();
  }, [watermarkUrl]);

// React to changes in startingDay
useEffect(() => {
  generateMonthRows(currentMonth, currentYear);
}, [startingDay, currentMonth, currentYear]);

  // Function to get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

// Function to generate rows for the month starting from a specific day
// Modify the existing generateMonthRows to use the new function
const generateMonthRows = (month, year) => {
  const newRows = generateMonthRowsWithDay(month, year, startingDay);
  setRows(newRows);
};


const generateMonthRowsWithDay = (month, year, day) => {
  const daysInMonth = getDaysInMonth(month, year);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  // Create header row with Arabic columns (right to left)
  const newRows = [
    ["اليوم", "التاريخ", "الحفظ", "المراجعة", "نوع التسميع"]
  ];
  
  // Create a row for each day starting from the provided day to the end of the month
  for (let i = day; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayName = days[date.getDay()];
    const dateStr = `${i}/${month + 1}`; // Month is 0-indexed, so add 1
    newRows.push([dayName, dateStr, "", "", ""]);
  }
  
  return newRows;
};

 // When chapter or page is selected, populate the الحفظ column
useEffect(() => {
  generateMonthRows(currentMonth, currentYear);
  if (selectedChapter && selectedPage && rows.length > 1) {
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
  }
}, [selectedPage, selectedChapter, rows.length, excludeWeekdays, pagesPerDay, alternateDay, startingDay, currentMonth, currentYear]);
  // Update available pages when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      const pages = [];
      for (let i = selectedChapter.starting_page; i <= selectedChapter.ending_page; i++) {
        pages.push(i);
      }
      setAvailablePages(pages);
      setSelectedPage(null);
    }
  }, [selectedChapter]);

  // Function to handle month change
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setCurrentMonth(newMonth);
    generateMonthRows(newMonth, currentYear);
  };

  // Function to handle year change
  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setCurrentYear(newYear);
    generateMonthRows(currentMonth, newYear);
  };

  // Function to load and process the watermark image
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

  const updateCell = (rowIndex, colIndex, value) => {
    const updated = rows.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell)) : row
    );
    setRows(updated);
  };

  const generateDoc = async () => {
    try {
      // Create title with participant name and month
      const titleText = `خطة المشترك/ة : ${participantName}    خلال شهر ${currentMonth + 1}`;
      const titleParagraph = new Paragraph({
        children: [
          new TextRun({
            text: titleText,
            bold: true,
            font: "Simplified Arabic",
            size: 24
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 }
      });
      
      // For the table in generateDoc function 
      const table = new Table({
        rows: rows.map((row, rowIndex) => 
          new TableRow({
            children: row.map((cell, colIndex) => 
              new TableCell({
                children: [new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      font: "Simplified Arabic",
                      size: 12 * 2, // docx uses half-points, so 12pt = 24 half-points
                      bold: rowIndex === 0
                    })
                  ],
                  alignment: AlignmentType.CENTER
                })],
                ...(rowIndex === 0 ? { shading: { fill: "CCCCCC" } } : {})
              })
            ),
          })
        ),
        width: {
          size: 100,
          type: "pct"
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        }
      });

      // Prepare document sections
      const sections = [{
        properties: {
          direction: "rtl"
        },
        children: [
          titleParagraph,
          table
        ]
      }];

      // Create document
      const doc = new Document({ sections });
      return await Packer.toBlob(doc);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      throw error;
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      // Create a container for everything
      const container = document.createElement('div');
      container.style.width = '1000px'; // A4 width in pixels at 72 DPI
      container.style.height = '1400px'; // A4 height
      container.style.position = 'relative';
      container.style.backgroundColor = 'white';
      
      // Add watermark directly as a background
      if (watermarkImageData) {
        const watermarkDiv = document.createElement('div');
        watermarkDiv.style.position = 'absolute';
        watermarkDiv.style.top = '-58px'; // Adjusted to position higher on the page
        watermarkDiv.style.bottom = '80';
        watermarkDiv.style.left = '0';
        watermarkDiv.style.width = '100%';
        watermarkDiv.style.height = '100%';
        watermarkDiv.style.backgroundImage = `url(${watermarkImageData})`;
        watermarkDiv.style.backgroundPosition = 'center center';
        watermarkDiv.style.backgroundRepeat = 'no-repeat';
        watermarkDiv.style.backgroundSize = '92%';
        watermarkDiv.style.opacity = '0.5';
        watermarkDiv.style.zIndex = '0';
        container.appendChild(watermarkDiv);
      }
      
      // Create content container with higher z-index
      const contentDiv = document.createElement('div');
      contentDiv.style.position = 'absolute';
      contentDiv.style.top = '0';
      contentDiv.style.left = '0';
      contentDiv.style.width = '100%';
      contentDiv.style.height = '100%';
      contentDiv.style.zIndex = '1';
      contentDiv.style.padding = '40px';
      contentDiv.style.boxSizing = 'border-box';
      contentDiv.style.fontFamily = 'Simplified Arabic, Arial';
      contentDiv.style.direction = 'rtl';
      container.appendChild(contentDiv);
      
      // Add Intro
      const intro = document.createElement('span');
      intro.textContent = "بسم الله الرحمن الرحيم";
      intro.style.fontFamily = 'Urdu Typesetting, Arial';
      intro.style.color = '#1f497d'; // Bootstrap primary color
      intro.style.textAlign = 'center';
      // intro.style.marginBottom = '5px';
      intro.style.fontWeight = 'bold';
      intro.style.fontSize = '20px';
      intro.style.display = 'block';
      contentDiv.appendChild(intro);

      // Add multaka slogan
      const slogan = document.createElement('span');
      slogan.textContent = "ملتقى الأقصى القرآني";
      slogan.style.fontFamily = 'Arabic Typesetting, Arial';
      slogan.style.color = '#984806'; // Bootstrap primary color
      slogan.style.textAlign = 'center';
      slogan.style.marginBottom = '8px';
      slogan.style.fontWeight = 'bold';
      slogan.style.fontSize = '25px';
      slogan.style.display = 'block';
      contentDiv.appendChild(slogan);
      // Add title
      const titleElem = document.createElement('h2');
      titleElem.textContent = `خطة المشترك/ة : ${participantName}     خلال شهر ${currentMonth + 1}`;
      titleElem.style.textAlign = 'center';
      titleElem.style.marginBottom = '20px';
      titleElem.style.fontWeight = 'bold';
      titleElem.style.fontSize = '18px';
      contentDiv.appendChild(titleElem);
      
      // Create table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '10px';
      
      // Add header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      rows[0].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid black';
        th.style.padding = '2px';
        th.style.paddingBottom = '16px';
        th.style.backgroundColor = '#CCCCCC';
        th.style.fontWeight = 'bold';
        th.style.textAlign = 'center';
        th.style.verticalAlign = 'middle';    // Vertical centering
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Add data rows
      const tbody = document.createElement('tbody');
      rows.slice(1).forEach((rowData, rowIndex) => {
        const tr = document.createElement('tr');
        rowData.forEach(cellText => {
          const td = document.createElement('td');
          td.textContent = cellText;
          td.style.border = '1px solid black';
          td.style.padding = '0px';
          td.style.paddingBottom = '12px';
          td.style.textAlign = 'center';
          td.style.verticalAlign = 'middle';    // Vertical centering
          // td.style.backgroundColor = rowIndex % 2 === 0 ? '#F9F9F9' : '#FFFFFF'; // Alternate row colors
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      contentDiv.appendChild(table);
      
      // Add to document, render with html2canvas, then remove
      document.body.appendChild(container);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      
      // Import dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // Render to canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true, // Allow tainted canvas
        logging: false,
        backgroundColor: 'white'
      });
      
      document.body.removeChild(container);
      
      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Convert to blob and return
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
      return blob;
    } catch (error) {
      console.error("Error generating PDF:", error);
      setLoading(false);
      throw error;
    }
  };

  const downloadDocx = async () => {
    try {
      setLoading(true);
      const blob = await generateDoc();
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      saveAs(blob, `خطة_الحفظ_${participantName}_${currentMonth}_${currentYear}.docx`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("حدث خطأ أثناء إنشاء ملف DOCX. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.");
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      const blob = await generatePDF();
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      saveAs(blob, `خطة_الحفظ_${participantName}_${currentMonth}_${currentYear}.pdf`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.");
    }
  };

 // Update PDF preview when rows, participant name, or watermark changes
useEffect(() => {
  if (debounceTimer.current) {
    clearTimeout(debounceTimer.current);
  }
  setLoading(true);
  debounceTimer.current = setTimeout(() => {
    generatePDF();
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

  // Generate year options (current year -5 to +5)
  const currentYearNum = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYearNum - 5; i <= currentYearNum + 5; i++) {
    yearOptions.push(i);
  }

  return (
    // Replace the top-level container div with this responsive container
<div className="flex flex-col h-screen w-screen overflow-hidden" dir="rtl">
  {/* Top Panel - Responsive control panel */}
  <div className="p-2 sm:p-4 bg-gray-100 border-b">
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
      {/* Participant Name Field - Full width on mobile */}
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
      
      {/* Month/Year selectors - Side by side on mobile */}
      <div className="flex flex-row gap-2 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
          <label className="font-medium">الشهر:</label>
          <select
            value={currentMonth}
            onChange={handleMonthChange}
            className="px-2 py-1 sm:px-3 sm:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            {/* Month options remain the same */}
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
      
      {/* Chapter Selection - Full width on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <label className="font-medium whitespace-nowrap">بداية الحفظ:</label>
        <div className="flex gap-2 flex-1">
          <select
            value={selectedChapter?.chapter_number || ""}
            onChange={(e) => {
              const chapter = chapters.find(c => c.chapter_number === parseInt(e.target.value));
              setSelectedChapter(chapter);
            }}
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
            {selectedChapter && availablePages.length > 0 && !selectedPage && setSelectedPage(availablePages[0])}
            {availablePages.map(page => (
              <option key={page} value={page}>ص {page}</option>
            ))}
          </select>
        </div>
        
        <button
          style={{ border: "1px solid black" }}
          className="w-full bg-transparent sm:w-auto flex justify-between items-center text-left font-medium  hover:text-blue-800 mt-1 sm:mt-0 "
          onClick={() => setAdvancedMenu(!advancedMenu)}
        >
          <span className="px-2">إعدادات متقدمة</span>
          <span>{advancedMenu ? '▲' : '▼'}</span>
        </button>
      </div>
    </div>
    
    {/* Advanced Settings - Responsive */}
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
                
                setStartingDay(validDay);
                const updatedRows = generateMonthRowsWithDay(currentMonth, currentYear, validDay);
                setRows(updatedRows);
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
          <div className="flex items-center">
            <input 
              id="ExcludeSundays" 
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["الأحد"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "الأحد": e.target.checked}))} 
            />
            <label htmlFor="ExcludeSundays" className="text-sm sm:text-base">استثناء يوم الأحد</label>
          </div>
          <div className="flex items-center">
            <input 
              id="ExcludeMondays"
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["الإثنين"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "الإثنين": e.target.checked}))} 
            />
            <label htmlFor="ExcludeMondays" className="text-sm sm:text-base">استثناء يوم الإثنين</label>
          </div>
          <div className="flex items-center">
            <input 
              id="ExcludeTuesdays"
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["الثلاثاء"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "الثلاثاء": e.target.checked}))} 
            />
            <label htmlFor="ExcludeTuesdays" className="text-sm sm:text-base">استثناء يوم الثلاثاء</label>
          </div>
          <div className="flex items-center">
            <input 
              id="ExcludeWednesdays"
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["الأربعاء"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "الأربعاء": e.target.checked}))} 
            />
            <label htmlFor="ExcludeWednesdays" className="text-sm sm:text-base">استثناء يوم الأربعاء</label>
          </div>
          <div className="flex items-center">
            <input 
              id="ExcludeThursdays"
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["الخميس"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "الخميس": e.target.checked}))} 
            />
            <label htmlFor="ExcludeThursdays" className="text-sm sm:text-base">استثناء يوم الخميس</label>
          </div>
          <div className="flex items-center">
            <input 
              id="ExcludeFridays"
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["الجمعة"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "الجمعة": e.target.checked}))} 
            />
            <label htmlFor="ExcludeFridays" className="text-sm sm:text-base">استثناء يوم الجمعة</label>
          </div>
          <div className="flex items-center">
            <input 
              id="ExcludeSaturdays"
              type="checkbox" 
              className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
              checked={excludeWeekdays["السبت"]}
              onChange={(e) => setExcludeWeekdays(prev => ({...prev, "السبت": e.target.checked}))} 
            />
            <label htmlFor="ExcludeSaturdays" className="text-sm sm:text-base">استثناء يوم السبت</label>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {/* Main Content - Stack vertically on mobile, side by side on desktop */}
  <div className=" flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
    {/* Table Panel - Full width on mobile */} 
    <div className="w-full min-h-60 lg:w-1/2 p-2 sm:p-4 overflow-y-auto overflow-x-hidden border-b lg:border-b-0 lg:border-l">
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold">جدول خطة الحفظ</h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            style={{ backgroundColor: "black" }}
            className="bg-green-600 text-white text-[5px] px-2 sm:px-4 py-1 sm:py-2 rounded  sm:text-base hover:bg-green-700 flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform duration-200"
            onClick={downloadDocx}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs">جاري المعالجة...</span> 
              </>
            ) : (
              "تحميل DOCX"
            )}
          </button>
          <button
            style={{ backgroundColor: "black" }}
            className="text-white px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base hover:bg-red-700 flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform duration-200"
            onClick={downloadPDF}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs">جاري المعالجة...</span> 
              </>
            ) : (
              "تحميل PDF"
            )}
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[calc(50vh-6rem)] lg:max-h-[calc(100vh-12rem)]">
        <table className="w-full table-auto border border-gray-300">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-200">
              {rows[0]?.map((header, colIndex) => (
                <th key={colIndex} className="border p-1 sm:p-2 text-center font-bold text-xs sm:text-base">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border p-1 sm:p-2 text-xs sm:text-base">
                    {colIndex === 4 ? (
                      <select
                        onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                        className="w-full border-none focus:outline-none bg-transparent text-center text-xs sm:text-base"
                        value={cell}
                      >
                        <option value="">اختر نوع التسميع</option>
                        <option value="مراجعة ذاتية">مراجعة ذاتية</option>
                        <option value="اتصال">اتصال</option>
                        <option value="اختبار">اختبار</option>
                      </select>
                    ) : (
                      <input
                        value={cell}
                        onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                        className="w-full border-none focus:outline-none bg-transparent text-center text-xs sm:text-base"
                        placeholder={`خانة ${rowIndex + 1},${colIndex}`}
                        readOnly={colIndex < 2} // Make date and day columns read-only
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    
    {/* PDF Preview - Full width on mobile */}
    <div className="w-full lg:w-1/2 p-2 sm:p-4 relative flex flex-col min-h-[50vh] lg:min-h-0">
    <div className="flex justify-center items-center align-items-center ">
      <div className="w-3 h-3  rounded-full animate-pulse bg-red-500 mb-3 ml-2"></div>
      <span className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center m-0"> PDF Live View </span>
    </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 sm:w-48 sm:h-48 border-t-transparent rounded-full animate-pulse">
              <img src="logo-removebg-preview.png" alt="" />
            </div>
            <p className="mt-2 sm:mt-4 text-black font-medium text-sm sm:text-base">جاري إنشاء التعديلات...</p>
          </div>
        </div>
      )}
      
      {pdfUrl && (
        <div className="flex-1 h-full">
          <iframe
            ref={pdfObjectRef}
            src={`${pdfUrl}#toolbar=0&view=FitH&scrollbar=1`}
            className="w-full h-full border"
            title="معاينة PDF"
          />
        </div>
      )}
    </div>
  </div>
</div>
  );
};

export default StakeholderEditor;