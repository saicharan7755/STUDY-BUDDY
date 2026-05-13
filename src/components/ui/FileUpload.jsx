import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const FileUpload = ({ onTextExtracted, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  const SUPPORTED_TYPES = {
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(Math.round((i / pdf.numPages) * 100));
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    return text;
  };

  const extractTextFromDOCX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromTXT = async (file) => {
    return await file.text();
  };

  const processFile = async (selectedFile) => {
    setError(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      let text = '';

      if (selectedFile.type === 'application/pdf') {
        text = await extractTextFromPDF(selectedFile);
      } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractTextFromDOCX(selectedFile);
      } else if (selectedFile.type === 'text/plain') {
        text = await extractTextFromTXT(selectedFile);
      }

      // Clean up the text
      text = text.replace(/\n+/g, '\n').trim();

      if (!text) {
        throw new Error('No text could be extracted from the file');
      }

      setPreview(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      onTextExtracted(text);

    } catch (err) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const validateFile = (selectedFile) => {
    if (!SUPPORTED_TYPES[selectedFile.type]) {
      throw new Error(`Unsupported file type. Please upload PDF, TXT, or DOCX files only.`);
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      throw new Error(`File size (${formatFileSize(selectedFile.size)}) exceeds the 10MB limit.`);
    }
  };

  const handleFileSelect = async (selectedFile) => {
    try {
      validateFile(selectedFile);
      setFile(selectedFile);
      await processFile(selectedFile);
    } catch (err) {
      setError(err.message);
      setFile(null);
      setPreview('');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setFile(null);
    setPreview('');
    setError(null);
    setProgress(0);
    onTextExtracted('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-accent bg-accent/10'
            : 'border-white/20 hover:border-accent/50 bg-surface/30'
        } ${error ? 'border-danger/50 bg-danger/5' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {file && !error ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-accent" />
              <div className="text-left">
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={handleRemove}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-danger transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400">Extracting text... {progress}%</p>
              </div>
            )}

            {!isProcessing && preview && (
              <div className="text-left">
                <p className="text-sm font-medium text-gray-300 mb-2">Preview:</p>
                <div className="bg-surface/50 rounded-lg p-3 text-sm text-gray-100 max-h-24 overflow-y-auto">
                  {preview}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className={`w-12 h-12 mx-auto ${error ? 'text-danger' : 'text-gray-400'}`} />
            <div>
              <p className="text-lg font-medium text-white mb-2">
                {error ? 'Upload Failed' : 'Upload Study Materials'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Drag and drop your PDF, TXT, or DOCX file here, or click to browse
              </p>
              <button
                onClick={handleBrowseClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Browse Files
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Supports PDF, TXT, DOCX • Max 10MB
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger-light">Upload Error</p>
            <p className="text-sm text-danger mt-1">{error}</p>
          </div>
        </div>
      )}

      {file && !error && !isProcessing && preview && (
        <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-success-light">File Processed Successfully</p>
            <p className="text-sm text-gray-300 mt-1">
              Text extracted and ready for flashcard generation
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;