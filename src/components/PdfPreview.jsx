// components/PdfPreview.jsx
import React from 'react';

const PdfPreview = ({ pdfUrl, loading, pdfObjectRef }) => {
  return (
    <div className="w-full lg:w-1/2 p-2 sm:p-4 relative flex flex-col min-h-[50vh] lg:min-h-0">
      <div className="flex justify-center items-center align-items-center">
        <div className="w-3 h-3 rounded-full animate-pulse bg-red-500 mb-3 ml-2"></div>
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
  );
};

export default PdfPreview;