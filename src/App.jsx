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

const StakeholderEditor = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [projectName, setProjectName] = useState("Agricultural Export Project");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watermarkUrl, setWatermarkUrl] = useState("/watermark.png");
  const [watermarkImageData, setWatermarkImageData] = useState(null);
  const debounceTimer = useRef(null);
  const pdfObjectRef = useRef(null);

  // Load watermark image on component mount
  useEffect(() => {
    loadWatermarkImage();
  }, [watermarkUrl]);

  // Initialize rows for the selected month when component mounts
  useEffect(() => {
    generateMonthRows(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  // Function to get days in month (accounting for leap years)
  const getDaysInMonth = (month, year) => {
    // Month is 0-indexed (0 = January, 11 = December)
    // Adding 1 to month and passing 0 as day gets the last day of the previous month
    return new Date(year, month + 1, 0).getDate();
  };

  // Function to check if a year is a leap year
  const isLeapYear = (year) => {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
  };

  // Function to generate rows for the full month
  const generateMonthRows = (month, year) => {
    const daysInMonth = getDaysInMonth(month, year);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create header row
    const newRows = [
      ["Day", "Date", "Stakeholder Name", "Organization", "Interest in Project"]
    ];
    
    // Create a row for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayName = days[date.getDay()];
      const dateStr = `${monthNames[month]} ${i}`;
      newRows.push([dayName, dateStr, "", "", ""]);
    }
    
    setRows(newRows);
  };

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
      
      // Convert to base64 for use with docx and pdf-lib
      const reader = new FileReader();
      reader.onload = () => {
        setWatermarkImageData(reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading watermark image:", error);
    }
  };

  // Function to select a different watermark from available options
  const selectWatermark = (url) => {
    setWatermarkUrl(url);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const updated = rows.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell)) : row
    );
    setRows(updated);
  };

  // Set PDF view to "fit to width" when PDF is loaded
  useEffect(() => {
    if (pdfObjectRef.current && pdfUrl) {
      // Add message listener to set view mode when PDF loads
      const handlePdfLoad = () => {
        try {
          if (pdfObjectRef.current) {
            // For browsers that support postMessage with PDF viewers
            pdfObjectRef.current.contentWindow.postMessage({
              type: 'setViewMode',
              mode: 'FitH'
            }, '*');
          }
        } catch (e) {
          console.error("Error setting PDF view mode:", e);
        }
      };

      // Set a timeout to ensure PDF has loaded
      const timeoutId = setTimeout(handlePdfLoad, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [pdfUrl]);

  const generateDoc = async () => {
    try {
      // Create title with project name
      const titleParagraph = new Paragraph({
        text: projectName,
        heading: "Heading1",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      });
      
      // Create subtitle
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const subtitleText = `Stakeholder Registry - ${monthNames[currentMonth]} ${currentYear}`;
      const subtitleParagraph = new Paragraph({
        text: subtitleText,
        heading: "Heading2",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      });

      // Create table with proper borders
      const table = new Table({
        rows: rows.map((row, rowIndex) => 
          new TableRow({
            children: row.map((cell, colIndex) => 
              new TableCell({
                children: [new Paragraph({
                  text: cell,
                  alignment: rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.LEFT
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
        children: [
          titleParagraph,
          subtitleParagraph,
          table
        ]
      }];

      // Add watermark to header if available
      if (watermarkImageData) {
        try {
          const imageBase64 = watermarkImageData.split(',')[1];
          
          // Add header with watermark image
          const header = new Header({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0)),
                    transformation: {
                      width: 600,
                      height: 300,
                      opacity: 0.2,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          });
          
          // Add header to sections
          sections[0].headers = { default: header };
        } catch (error) {
          console.error("Error adding watermark to DOCX:", error);
        }
      }

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
      // Create a larger page to accommodate all rows
      const pageHeight = 800 + (rows.length * 30);
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([800, Math.max(1000, pageHeight)]);
      const { width, height } = page.getSize();

      // Add watermark if available
      if (watermarkImageData) {
        try {
          const imageData = watermarkImageData.split(',')[1];
          let pdfImage;
          
          if (watermarkImageData.includes('image/png')) {
            pdfImage = await pdfDoc.embedPng(Uint8Array.from(atob(imageData), c => c.charCodeAt(0)));
          } else if (watermarkImageData.includes('image/jpeg') || watermarkImageData.includes('image/jpg')) {
            pdfImage = await pdfDoc.embedJpg(Uint8Array.from(atob(imageData), c => c.charCodeAt(0)));
          }
          
          if (pdfImage) {
            // Scale image to fit page while maintaining aspect ratio
            const imgDims = pdfImage.scale(0.5);
            page.drawImage(pdfImage, {
              x: width / 2 - imgDims.width / 2,
              y: height / 2 - imgDims.height / 2,
              width: imgDims.width,
              height: imgDims.height,
              opacity: 0.15, // Make watermark more subtle
            });
          }
        } catch (error) {
          console.error("Error adding watermark to PDF:", error);
        }
      }

      // Add project name as title
      page.drawText(projectName, {
        x: width / 2 - ((projectName.length * 9) / 2),
        y: height - 50,
        size: 18,
        color: rgb(0, 0, 0)
      });

      // Add subtitle with month and year
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const subtitleText = `Stakeholder Registry - ${monthNames[currentMonth]} ${currentYear}`;
      page.drawText(subtitleText, {
        x: width / 2 - ((subtitleText.length * 7) / 2),
        y: height - 80,
        size: 14,
        color: rgb(0, 0, 0)
      });

      // Draw table
      const tableStartY = height - 120;
      const cellPadding = 10;
      const rowHeight = 30;
      // Adjust column widths for 5 columns
      const colWidths = [100, 100, 200, 200, 160];
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      const tableStartX = (width - tableWidth) / 2;

      // Draw table header background
      page.drawRectangle({
        x: tableStartX,
        y: tableStartY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Draw table grid and content
      rows.forEach((row, rowIndex) => {
        let cellX = tableStartX;
        const cellY = tableStartY - rowIndex * rowHeight;
        
        // Draw horizontal grid line
        page.drawLine({
          start: { x: tableStartX, y: cellY },
          end: { x: tableStartX + tableWidth, y: cellY },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        row.forEach((cell, colIndex) => {
          const cellWidth = colWidths[colIndex];
          
          // Draw vertical grid line
          page.drawLine({
            start: { x: cellX, y: cellY },
            end: { x: cellX, y: cellY - rowHeight },
            thickness: 1,
            color: rgb(0, 0, 0),
          });

          // Draw cell text
          page.drawText(cell || "", {
            x: cellX + cellPadding,
            y: cellY - rowHeight + cellPadding,
            size: 10,
            color: rgb(0, 0, 0)
          });

          cellX += cellWidth;

          // Draw last vertical grid line
          if (colIndex === row.length - 1) {
            page.drawLine({
              start: { x: cellX, y: cellY },
              end: { x: cellX, y: cellY - rowHeight },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
          }
        });

        // Draw bottom grid line for the last row
        if (rowIndex === rows.length - 1) {
          page.drawLine({
            start: { x: tableStartX, y: cellY - rowHeight },
            end: { x: tableStartX + tableWidth, y: cellY - rowHeight },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
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
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      saveAs(blob, `${projectName.replace(/\s+/g, '_')}_${monthNames[currentMonth]}_${currentYear}.docx`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("Error generating DOCX file. Check console for details.");
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      const blob = await generatePDF();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      saveAs(blob, `${projectName.replace(/\s+/g, '_')}_${monthNames[currentMonth]}_${currentYear}.pdf`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert("Error generating PDF file. Check console for details.");
    }
  };

  // Update PDF preview when rows, project name, or watermark changes
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
  }, [rows, projectName, watermarkImageData, currentMonth, currentYear]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  // List of available watermarks in public folder
  const availableWatermarks = [
    { name: "Default", url: "/watermark.png" },
    { name: "Company Logo", url: "/logo.png" },
    { name: "Confidential", url: "/confidential.png" }
  ];

  // Generate year options (current year -5 to +5)
  const currentYearNum = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYearNum - 5; i <= currentYearNum + 5; i++) {
    yearOptions.push(i);
  }

  return (
    <div className="flex flex-col h-screen w-screen w-full">
      {/* Top Panel - Project Name, Month/Year and Watermark controls */}
      <div className="p-4 bg-gray-100 border-b">
        <div className="flex flex-wrap gap-4">
          {/* Project Name Field */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Project Name:</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Month:</label>
            <select
              value={currentMonth}
              onChange={handleMonthChange}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>January</option>
              <option value={1}>February</option>
              <option value={2}>March</option>
              <option value={3}>April</option>
              <option value={4}>May</option>
              <option value={5}>June</option>
              <option value={6}>July</option>
              <option value={7}>August</option>
              <option value={8}>September</option>
              <option value={9}>October</option>
              <option value={10}>November</option>
              <option value={11}>December</option>
            </select>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Year:</label>
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Watermark Selection */}
          <div className="flex items-center gap-2">
            <label className="font-medium">Watermark:</label>
            <div className="flex gap-2">
              {availableWatermarks.map((watermark) => (
                <button
                  key={watermark.url}
                  onClick={() => selectWatermark(watermark.url)}
                  className={`px-3 py-1 rounded ${
                    watermarkUrl === watermark.url 
                      ? "bg-blue-500 text-white" 
                      : "bg-white border hover:bg-gray-100"
                  }`}
                >
                  {watermark.name}
                </button>
              ))}
            </div>
            {watermarkImageData && (
              <div className="flex items-center gap-2">
                <img 
                  src={watermarkImageData} 
                  alt="Watermark preview" 
                  className="h-10 border" 
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content - Full width */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Panel */}
        <div className="w-1/2 p-4 overflow-auto border-r">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Stakeholder Table Editor</h2>
            <div className="flex gap-2">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                onClick={downloadDocx}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  "Download DOCX"
                )}
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                onClick={downloadPDF}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  "Download PDF"
                )}
              </button>
            </div>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-12rem)]">
            <table className="w-full table-auto border border-gray-300">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-200">
                  {rows[0]?.map((header, colIndex) => (
                    <th key={colIndex} className="border p-2 text-center">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border p-2">
                        <input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                          className="w-full border-none focus:outline-none bg-transparent"
                          placeholder={`Cell ${rowIndex + 1},${colIndex}`}
                          readOnly={colIndex < 2} // Make day and date columns read-only
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 p-4 relative flex flex-col">
          <h2 className="text-xl font-bold mb-4">Live PDF Preview</h2>
          
          {/* Loading Spinner - Full Screen Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-blue-600 font-medium">Generating Preview...</p>
              </div>
            </div>
          )}
          
          {pdfUrl && (
            <div className="flex-1 h-full">
              <object
                ref={pdfObjectRef}
                data={`${pdfUrl}#toolbar=0&view=FitH&scrollbar=1`}
                type="application/pdf"
                className="w-full h-full border"
                aria-label="PDF Preview"
                style={{ width: '100%', height: '100%' }}
              >
                <p>Your browser does not support PDFs. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download the PDF</a>.</p>
              </object>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakeholderEditor;