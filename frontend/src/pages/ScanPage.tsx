import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ComplianceScore from '../components/ComplianceScore';
import ExtractedFieldsTable from '../components/ExtractedFieldsTable';
import ViolationCard from '../components/ViolationCard';
import { apiService } from '../services/api';
import { ScanDetail } from '../types';
import { FileText, Download, RotateCcw, AlertTriangle, CheckCircle, Package } from 'lucide-react';

const PROCESSING_STEPS = [
  'Uploading image...',
  'Detecting Principal Display Panel (PDP)...',
  'Classifying package shape...',
  'Extracting text via OCR...',
  'Validating LMPC Rules 2011...',
  'Generating compliance report...',
];

const ScanPage: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processStep, setProcessStep] = useState('');
  const [result, setResult] = useState<ScanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulateSteps = () => {
    let stepIndex = 1;
    const interval = setInterval(() => {
      if (stepIndex < PROCESSING_STEPS.length) {
        setProcessStep(PROCESSING_STEPS[stepIndex]);
        setProgress(Math.min(90, 15 + stepIndex * 15));
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1000);
    return interval;
  };

  const handleFileSelect = async (selectedFile: File) => {
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
    setResult(null);
    setIsProcessing(true);
    setProcessStep(PROCESSING_STEPS[0]);
    setProgress(10);

    const stepInterval = simulateSteps();

    try {
      const data = await apiService.uploadScan(selectedFile, (e) => {
        if (e.total) {
          const uploadPct = Math.round((e.loaded * 100) / e.total);
          if (uploadPct < 100) {
            setProgress(Math.min(uploadPct, 20));
          }
        }
      });

      clearInterval(stepInterval);
      if (data.status === 'failed' || data.extraction_source === 'failed') {
        // Nothing could be read from the image — say so plainly instead
        // of showing a "0% compliant" result for a label we never
        // actually analyzed.
        setError(
          data.extraction_message ||
            'Could not extract label text from this image. Try a clearer photo, or use one of the sample labels below.'
        );
        setIsProcessing(false);
        return;
      }
      setResult(data);
      setProgress(100);
      setProcessStep('Complete!');
      setIsProcessing(false);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Scan error:', err);
      const detail = err?.response?.data?.detail;
      setError(
        detail ||
          'An error occurred during scanning. Make sure the backend server is running at http://localhost:8000'
      );
      setIsProcessing(false);
    }
  };

  const handleSelectPreloadedSample = async (sampleFilename: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      setProcessStep('Loading sample package image...');
      setProgress(15);

      const res = await fetch(`/sample_labels/${sampleFilename}`);
      if (!res.ok) {
        throw new Error('Failed to load sample image');
      }
      const blob = await res.blob();
      const file = new File([blob], sampleFilename, { type: blob.type || 'image/png' });
      await handleFileSelect(file);
    } catch (err) {
      console.error('Error loading sample:', err);
      setError('Could not load sample automatically. You can also select the file directly from sample_labels/.');
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProcessStep('');
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      await apiService.downloadPdfReport(result.id);
    } catch (err) {
      console.error('PDF download failed:', err);
      setError('Could not download the PDF report. Please try again.');
    }
  };

  const handleDownloadDocx = async () => {
    if (!result) return;
    try {
      await apiService.downloadDocxReport(result.id);
    } catch (err) {
      console.error('DOCX download failed:', err);
      setError('Could not download the DOCX report. Please try again.');
    }
  };

  const displayProductName = result?.product_name || result?.original_filename || 'Package Label';
  const displayImageSrc = previewUrl || (result?.filename ? `/uploads/${result.filename}` : (result?.original_filename ? `/sample_labels/${result.original_filename}` : ''));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            Scan Product Label
          </h1>
          <p className="text-gray-500 mt-1">
            Upload a clear image of the product label to check LMPC compliance
            under Rules 6, 7, 8 &amp; 18.
          </p>
        </div>
        {result && (
          <button
            onClick={resetScan}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a72] transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> New Scan
          </button>
        )}
      </div>

      {/* Upload Area */}
      {!result && !isProcessing && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <FileUpload onFileSelect={handleFileSelect} isLoading={isProcessing} />

          {/* Quick Test Samples */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              ⚡ Or Test Instantly With a Sample Package Label:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleSelectPreloadedSample('sample_1_compliant.png')}
                className="flex flex-col text-left p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all group"
              >
                <span className="font-semibold text-sm text-emerald-950 flex items-center gap-1.5">
                  <span>🌰</span> Almonds (500g)
                </span>
                <span className="text-xs text-emerald-700 mt-1">Rule 6 Fully Compliant</span>
                <span className="text-[11px] text-emerald-600 font-medium mt-2 group-hover:underline">Click to Scan &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreloadedSample('sample_2_missing_mrp.png')}
                className="flex flex-col text-left p-3.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100/70 hover:border-red-300 transition-all group"
              >
                <span className="font-semibold text-sm text-red-950 flex items-center gap-1.5">
                  <span>🌾</span> Wheat Atta (5kg)
                </span>
                <span className="text-xs text-red-700 mt-1">Rule 6(1)(e): Missing MRP</span>
                <span className="text-[11px] text-red-600 font-medium mt-2 group-hover:underline">Click to Scan &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreloadedSample('sample_3_missing_mfg_address.png')}
                className="flex flex-col text-left p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-300 transition-all group"
              >
                <span className="font-semibold text-sm text-amber-950 flex items-center gap-1.5">
                  <span>🌶️</span> Bhujia Namkeen (200g)
                </span>
                <span className="text-xs text-amber-800 mt-1">Rule 6(1)(a): Missing Address</span>
                <span className="text-[11px] text-amber-700 font-medium mt-2 group-hover:underline">Click to Scan &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreloadedSample('sample_4_missing_origin_import.png')}
                className="flex flex-col text-left p-3.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 transition-all group"
              >
                <span className="font-semibold text-sm text-purple-950 flex items-center gap-1.5">
                  <span>🍫</span> Swiss Chocolate (100g)
                </span>
                <span className="text-xs text-purple-800 mt-1">Rule 6(1)(g): Missing Origin</span>
                <span className="text-[11px] text-purple-700 font-medium mt-2 group-hover:underline">Click to Scan &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Animation */}
      {isProcessing && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-8">
          {/* Spinner */}
          <div className="relative w-32 h-32">
            <svg
              className="animate-spin w-full h-full text-gray-200"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                stroke="currentColor"
              />
            </svg>
            <svg
              className="animate-spin absolute inset-0 w-full h-full text-[#1e3a5f]"
              viewBox="0 0 100 100"
              style={{ animationDirection: 'reverse', animationDuration: '3s' }}
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeDasharray="70 200"
                strokeLinecap="round"
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-[#1e3a5f]">
                {progress}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {processStep}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Please wait while our AI analyzes the label against Legal
              Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-[#1e3a5f] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step List */}
          <div className="w-full max-w-md space-y-2">
            {PROCESSING_STEPS.map((step, i) => {
              const stepProgress = 15 + i * 15;
              const isDone = progress >= stepProgress + 15;
              const isCurrent = processStep === step;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-2 text-sm ${
                    isDone
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-[#1e3a5f] font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300" />
                  )}
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Scanning Failed</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={resetScan}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Offline demo-data notice */}
          {result.extraction_source === 'demo_fallback' && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-800 font-medium">Showing offline demo data</h3>
                <p className="text-amber-700 text-sm mt-1">
                  {result.extraction_message ||
                    'Live AI extraction was unavailable, so this is offline demo data for this sample label — not a live scan of the uploaded image.'}
                </p>
              </div>
            </div>
          )}

          {/* Score + Image + Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-primary" /> Product Identification
                </span>
                <h2 className="text-xl font-bold text-[#1e3a5f] mt-0.5">
                  {displayProductName}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Download PDF
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download DOCX
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left: Image + Score */}
              <div className="md:col-span-1 flex flex-col items-center gap-6">
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 flex items-center justify-center">
                  <img
                    src={displayImageSrc}
                    alt={displayProductName}
                    className="w-full h-auto max-h-80 rounded object-contain"
                  />
                </div>
                <ComplianceScore
                  score={result.compliance_score}
                  status={result.compliance_status}
                  size="lg"
                />
              </div>

              {/* Right: Extracted Fields */}
              <div className="md:col-span-2">
                <h3 className="text-md font-semibold text-[#1e3a5f] mb-4 border-b pb-2">
                  Extracted Mandatory Declarations (Rule 6)
                </h3>
                <ExtractedFieldsTable fields={result.fields} />
              </div>
            </div>
          </div>

          {/* Violations */}
          {result.violations && result.violations.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Violations Detected ({result.violations.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.violations.map((violation) => (
                  <ViolationCard key={violation.id} violation={violation} />
                ))}
              </div>
            </div>
          )}

          {/* No Violations */}
          {result.violations && result.violations.length === 0 && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Fully Compliant
                </h3>
                <p className="text-green-700">
                  No statutory violations detected. This product label satisfies all mandatory declarations under LMPC Rules 2011.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanPage;
