import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Edit2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ShieldCheck,
  Calendar,
  Tag,
  CheckCircle2,
  Maximize2,
  ExternalLink,
} from 'lucide-react';

interface DocumentViewerModalProps {
  doc: any | null;
  onClose: () => void;
  onDelete?: (id: number) => void;
  onEdit?: (doc: any) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  doc,
  onClose,
  onDelete,
  onEdit,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!doc) return null;

  const isImage =
    doc.fileType?.includes('image') ||
    doc.fileData?.startsWith('data:image') ||
    doc.fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  const isPdf =
    doc.fileType?.includes('pdf') ||
    doc.fileData?.startsWith('data:application/pdf') ||
    doc.fileName?.match(/\.pdf$/i);

  const handleDownload = () => {
    let dataUrl = doc.fileData;
    if (!dataUrl) {
      window.open(`/api/documents/${doc.id}/download`, '_blank');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = doc.fileName || `${doc.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (isImage) {
      const win = window.open('');
      if (win) {
        win.document.write(`<html><head><title>${doc.title}</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;"><img src="${doc.fileData}" style="max-width:100%;max-height:100vh;"/></body></html>`);
        win.document.close();
        win.focus();
        win.print();
        win.close();
      }
    } else {
      window.print();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete "${doc.title}"?`)) {
      if (onDelete) {
        onDelete(doc.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {doc.title}
              </h3>
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {doc.docType?.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                v{doc.version || 1}
              </span>
              {doc.ocrVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> OCR Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
          {isImage && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 text-slate-700 dark:text-slate-200">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-1 font-semibold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Rotate 90deg"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            title="Download document file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>

          {onEdit && (
            <button
              onClick={() => {
                onEdit(doc);
                onClose();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
              title="Edit document title, type, notes"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors"
              title="Delete this document"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 my-2 sm:my-3 rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800 flex items-center justify-center p-2 relative shadow-2xl">
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <img
              src={doc.fileData}
              alt={doc.title}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md select-none"
            />
          </div>
        ) : isPdf ? (
          <div className="w-full h-full flex flex-col">
            <iframe
              src={doc.fileData}
              className="w-full h-full rounded-xl border-0 bg-white"
              title={doc.title}
            />
          </div>
        ) : (
          <div className="text-center p-8 max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
            <FileText className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              {doc.title}
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              {doc.fileName} ({doc.fileType})
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              This document type can be inspected or downloaded directly for full resolution review.
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" /> Download File
            </button>
          </div>
        )}
      </div>

      {/* Bottom Notes & Tags Info Bar */}
      {(doc.notes || doc.tags || doc.ocrExtractedData) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xl shrink-0 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {doc.notes && (
              <p className="text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white">Notes:</strong> {doc.notes}
              </p>
            )}
            {doc.tags && (
              <div className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">{doc.tags}</span>
              </div>
            )}
          </div>
          {doc.ocrExtractedData && (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              AI OCR Data Available
            </span>
          )}
        </div>
      )}
    </div>
  );
};
