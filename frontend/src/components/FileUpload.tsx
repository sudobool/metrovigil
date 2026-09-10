import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 
          ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {!preview ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100 text-primary' : 'bg-gray-100 text-gray-500'}`}>
              <Upload className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop image here...' : 'Drag & drop product label image here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to select file</p>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Supports JPG, PNG, WEBP (Max 10MB)
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-[300px] object-contain rounded-lg shadow-sm mb-4"
            />
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                {selectedFile?.name}
              </span>
              <button 
                onClick={clearFile}
                className="ml-2 p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
