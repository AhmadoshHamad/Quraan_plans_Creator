// documentGenerators.js - Utilities for generating documents
import { 
    Document, 
    Packer, 
    Paragraph, 
    Table, 
    TableRow, 
    TableCell, 
    AlignmentType,
    BorderStyle,
    TextRun
  } from "docx";
  
  /**
   * Generates a DOCX document with the given data
   * @param {Array} rows Table data rows
   * @param {string} participantName Name of participant
   * @param {number} currentMonth Current month (0-11)
   * @param {number} currentYear Current year
   * @returns {Promise<Blob>} Blob containing the document
   */
  export const generateDoc = async (rows, participantName, currentMonth, currentYear) => {
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
  
  /**
   * Generates a PDF document with the given data
   * @param {Array} rows Table data rows
   * @param {string} participantName Name of participant
   * @param {number} currentMonth Current month (0-11)
   * @param {string} watermarkImageData Base64 string of watermark image
   * @returns {Promise<Blob>} Blob containing the PDF document
   */
  export const generatePDF = async (rows, participantName, currentMonth, watermarkImageData) => {
    try {
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
      return blob;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };