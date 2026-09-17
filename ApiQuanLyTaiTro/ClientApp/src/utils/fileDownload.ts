import { saveAs } from "file-saver";

/**
 * Utility function để download file từ API response
 * @param blob - Blob data từ API
 * @param headers - Response headers từ API  
 * @param defaultFilename - Tên file mặc định nếu không có trong headers
 */
export const downloadFileFromResponse = (
  blob: Blob, 
  headers?: any, 
  defaultFilename?: string
) => {
  let filename = defaultFilename || `file-${new Date().getTime()}`;
  
  // Tự động detect extension từ MIME type
  if (!filename.includes('.')) {
    const mimeType = blob.type;
    if (mimeType.includes('wordprocessingml')) {
      filename += '.docx';
    } else if (mimeType.includes('spreadsheetml')) {
      filename += '.xlsx';
    } else if (mimeType.includes('pdf')) {
      filename += '.pdf';
    }
  }
  // Extract filename từ Content-Disposition header (case-insensitive)
  let contentDisposition = null;
  
  // Tìm Content-Disposition header với case-insensitive
  if (headers) {
    const headerKeys = Object.keys(headers);
    const dispositionKey = headerKeys.find(key => 
      key.toLowerCase() === 'content-disposition'
    );
    
    if (dispositionKey) {
      contentDisposition = headers[dispositionKey];
  }
  
  if (contentDisposition) {
    
    // Ưu tiên filename* (UTF-8 encoded)
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (filenameStarMatch?.[1]) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else {
      // Fallback về filename thông thường
      const filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1].replace(/["']/g, '').trim();
      } 
      }
    }
  }
  

  
  // Download file
  saveAs(blob, filename);
};

/**
 * Simplified version - chỉ cần 1 dòng code
 */
export const quickDownload = (blob: Blob, filename?: string) => {
  saveAs(blob, filename || `download-${Date.now()}`);
};
