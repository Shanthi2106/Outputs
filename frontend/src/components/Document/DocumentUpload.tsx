import { useState, useRef } from 'react';
import api from '@/services/api';
import { formatFileSize } from '@/utils/exportUtils';
import DocumentAnalysis from './DocumentAnalysis';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  const acceptedExtensions = '.pdf,.docx,.doc,.txt';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, Word, or Text files only.');
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await api.uploadDocument(file);
      setAnalysis(result.analysis);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload document');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Document
        </h2>
        <p className="text-gray-600">
          Upload an IEP, therapy notes, or assessment report to automatically identify and explain autism-related terms.
        </p>
      </div>

      {!analysis ? (
        <div className="card">
          {/* File Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
              ${file ? 'bg-green-50 border-green-300' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedExtensions}
              onChange={handleChange}
            />

            {!file ? (
              <>
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drag & drop your document here
                </h3>
                <p className="text-gray-600 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Supports PDF, Word (.docx, .doc), and Text files • Max 5MB
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {file.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {uploading ? 'Analyzing...' : 'Analyze Document'}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={uploading}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Choose Different File
                  </button>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">⚠️ {error}</p>
            </div>
          )}

          {uploading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-800">
                  Analyzing document... This may take a few moments.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <DocumentAnalysis analysis={analysis} onReset={handleReset} />
      )}
    </div>
  );
}
