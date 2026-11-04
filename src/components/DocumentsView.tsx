import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  FolderLock,
  Upload,
  Camera,
  Download,
  Printer,
  Archive,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  X,
  Eye,
  Filter,
  CheckSquare,
  Square,
  Tag,
  ShieldCheck,
  Edit2,
  Trash2,
  Tractor,
  FileSpreadsheet,
} from 'lucide-react';
import { downloadDocumentsAsZip } from '../utils/zipDownloader.ts';
import { DocumentViewerModal } from './DocumentViewerModal.tsx';
import { exportToCSV, exportToPDF } from '../utils/exporter.ts';
import { fetchJson } from '../utils/apiClient.ts';

export const DocumentsView: React.FC = () => {
  const { t, showToast, searchQuery, confirm } = useApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [tractors, setTractors] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [bundlingZip, setBundlingZip] = useState(false);

  // Edit Doc Modal State
  const [editTitle, setEditTitle] = useState('');
  const [editDocType, setEditDocType] = useState('rc');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editOcrVerified, setEditOcrVerified] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('rc');
  const [vehicleId, setVehicleId] = useState('');
  const [showroomId, setShowroomId] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [fileData, setFileData] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [uploading, setUploading] = useState(false);

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const [docs, vehicles, showrooms] = await Promise.all([
        fetchJson<any[]>(`/api/documents?docType=${docTypeFilter}`, { fallback: [] }),
        fetchJson<any[]>('/api/vehicles', { fallback: [] }),
        fetchJson<any[]>('/api/showrooms', { fallback: [] }),
      ]);

      setDocuments(docs || []);
      setTractors(vehicles || []);
      setShowrooms(showrooms || []);
    } catch (err: any) {
      console.warn('DocumentsView fetch error:', err);
      showToast(err.message || 'Unable to sync documents at this moment', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [docTypeFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileType(file.type || 'application/pdf');
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileData || !title.trim()) {
      showToast('Please select a file and enter a title', 'error');
      return;
    }

    setUploading(true);
    try {
      const selectedTractor = tractors.find((t) => t.id === parseInt(vehicleId, 10));
      const payload = {
        title: title.trim(),
        docType,
        fileName,
        fileType,
        fileData,
        clientId: selectedTractor?.clientId || null,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        tags: tags.trim(),
        notes: notes.trim(),
      };

      await fetchJson('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      showToast('Document securely added to cabinet', 'success');
      setShowUploadModal(false);
      resetUploadForm();
      fetchDocs();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setTitle('');
    setDocType('rc');
    setVehicleId('');
    setShowroomId('');
    setTags('');
    setNotes('');
    setFileData('');
    setFileName('');
  };

  // Open Full Document in rich viewer
  const openViewDoc = async (id: number) => {
    try {
      const doc = await fetchJson<any>(`/api/documents/${id}`);
      setViewingDoc(doc);
    } catch (err: any) {
      showToast(err.message || 'Failed to load document content', 'error');
    }
  };

  const openEditModal = (doc: any) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || '');
    setEditDocType(doc.docType || 'rc');
    setEditTags(doc.tags || '');
    setEditNotes(doc.notes || '');
    setEditOcrVerified(!!doc.ocrVerified);
  };

  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setSavingEdit(true);
    try {
      const updated = await fetchJson<any>(`/api/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          docType: editDocType,
          tags: editTags.trim(),
          notes: editNotes.trim(),
          ocrVerified: editOcrVerified,
        }),
      });

      showToast('Document metadata updated', 'success');
      setEditingDoc(null);
      fetchDocs();
      if (viewingDoc?.id === editingDoc.id) {
        setViewingDoc({ ...viewingDoc, ...updated });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update document metadata', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document from the vault? This action cannot be undone.',
      confirmText: 'Delete Document',
      variant: 'danger',
      onConfirm: async () => {
        await fetchJson(`/api/documents/${id}`, { method: 'DELETE' });
        showToast('Document removed', 'info');
        fetchDocs();
        if (viewingDoc?.id === id) setViewingDoc(null);
      },
    });
  };

  // Checkbox selection for ZIP bundle
  const toggleSelectDoc = (id: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllDocs = () => {
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map((d) => d.id));
    }
  };

  // Download ZIP bundle of selected documents for offline record keeping
  const handleDownloadBundle = async () => {
    if (selectedDocIds.length === 0) {
      showToast(t.docs.noDocsSelected || 'Please select at least one document to bundle', 'error');
      return;
    }

    setBundlingZip(true);
    try {
      const result = await downloadDocumentsAsZip({
        docIds: selectedDocIds,
        entityType: 'general',
        entityId: `BUNDLE-${Date.now().toString().slice(-4)}`,
        entityName: `${selectedDocIds.length} Selected Cabinet Documents`,
      });

      showToast(`Downloaded offline ZIP bundle with ${result.count} documents!`, 'success');
      setSelectedDocIds([]);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBundlingZip(false);
    }
  };

  // Mobile Camera Capture
  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      showToast('Camera access denied or unavailable', 'error');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setFileData(dataUrl);
      setFileName(`Camera_Scan_${Date.now()}.jpg`);
      setFileType('image/jpeg');
      if (!title) setTitle(`Mobile Camera Scan ${new Date().toLocaleDateString()}`);
      stopCamera();
      setShowUploadModal(true);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q) ||
      d.clientName?.toLowerCase().includes(q) ||
      d.vehicleReg?.toLowerCase().includes(q) ||
      d.showroomName?.toLowerCase().includes(q) ||
      d.tags?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (filteredDocs.length === 0) {
      showToast('No documents to export for current filter', 'info');
      return;
    }

    const headers = [
      'Doc ID',
      'Document Title',
      'Type',
      'Farmer / Owner',
      'Tractor Reg',
      'Showroom / Dealer',
      'File Name',
      'File Type',
      'Size (KB)',
      'Upload Date',
      'OCR Verified',
      'Tags',
    ];

    const rows = filteredDocs.map((d) => [
      d.id,
      d.title,
      d.docType.toUpperCase(),
      d.clientName || 'N/A',
      d.vehicleReg || 'N/A',
      d.showroomName || 'N/A',
      d.fileName,
      d.fileType,
      d.fileSize ? Math.round(d.fileSize / 1024) : 'N/A',
      new Date(d.createdAt).toLocaleDateString(),
      d.ocrVerified ? 'YES' : 'NO',
      d.tags || '',
    ]);

    exportToCSV({
      filename: `Karnataka_RTO_Documents_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
    });
    showToast(`Exported ${filteredDocs.length} documents index to CSV`, 'success');
  };

  const handleExportPDF = () => {
    if (filteredDocs.length === 0) {
      showToast('No documents to export for current filter', 'info');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Type',
      'Farmer Name',
      'Tractor Reg',
      'Showroom / Dealership',
      'File Name',
      'Upload Date',
      'OCR',
    ];

    const rows = filteredDocs.map((d) => [
      d.id,
      d.title,
      d.docType.toUpperCase(),
      d.clientName || '-',
      d.vehicleReg || '-',
      d.showroomName || '-',
      d.fileName,
      new Date(d.createdAt).toLocaleDateString(),
      d.ocrVerified ? 'VERIFIED' : 'PENDING',
    ]);

    exportToPDF({
      filename: `Karnataka_RTO_Documents_${new Date().toISOString().split('T')[0]}`,
      title: 'Karnataka RTO Documents Cabinet Index',
      subtitle: 'Official Tractor & Agricultural Machinery Document Vault Index',
      headers,
      rows,
      metadata: {
        'Document Type Filter': docTypeFilter === 'all' ? 'All Types' : docTypeFilter.toUpperCase(),
        'Total Filtered Files': filteredDocs.length,
        ...(searchQuery ? { 'Search Keyword': searchQuery } : {}),
      },
    });
    showToast('PDF print preview opened', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t.docs.title}
          </h2>
          <p className="text-xs text-slate-500">
            Private document vault • Zero public exposure • Versioning & ZIP bundle download
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bundle Download button */}
          {selectedDocIds.length > 0 && (
            <button
              onClick={handleDownloadBundle}
              disabled={bundlingZip}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {bundlingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download Bundle ({selectedDocIds.length} Selected)
            </button>
          )}

          {/* Export Actions */}
          <button
            onClick={handleExportCSV}
            title="Download documents list as CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            title="Print or Save documents index as PDF"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export PDF</span>
          </button>

          {/* Camera Capture shortcut */}
          <button
            onClick={startCamera}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Camera Scan
          </button>

          {/* Upload Button */}
          <button
            onClick={() => {
              resetUploadForm();
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Filter and Selection bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={selectAllDocs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
          >
            {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({selectedDocIds.length})</span>
          </button>

          <span className="text-slate-400">•</span>

          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold border-0 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Document Types</option>
            <option value="rc">Registration Certificate (RC)</option>
            <option value="insurance">Insurance Policy</option>
            <option value="temp_registration">Temporary Registration (TR)</option>
            <option value="form_20">Form 20</option>
            <option value="form_21">Form 21</option>
            <option value="form_22">Form 22</option>
            <option value="showroom_invoice">Showroom Invoice</option>
            <option value="noc">NOC</option>
            <option value="form_35">Form 35</option>
            <option value="aadhaar">Aadhaar Proof</option>
          </select>
        </div>

        <span className="text-slate-400 text-right">
          Total: {filteredDocs.length} files in cabinet
        </span>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDocs.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSelectDoc(doc.id)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold uppercase text-xs">
                      {doc.docType}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          v{doc.version}
                        </span>
                        {doc.ocrVerified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                            OCR Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {doc.clientName ? `Farmer/Owner: ${doc.clientName}` : ''}{' '}
                        {doc.vehicleReg ? `• Tractor/Machinery: ${doc.vehicleReg}` : ''}{' '}
                        {doc.showroomName ? `• Showroom: ${doc.showroomName}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {doc.fileName} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => openViewDoc(doc.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 inline-flex items-center gap-1"
                      title="View & Inspect Document"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => openEditModal(doc)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 inline-flex items-center gap-1"
                      title="Edit Document Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <FolderLock className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500" />
            <p className="text-sm font-semibold">No documents in this category.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "Upload Document" or use "Camera Scan" to attach RTO paperwork.
            </p>
          </div>
        )}
      </div>

      {/* Full-Featured Document Viewer Modal (Zoom, Pan, Rotate, PDF/Image preview, Print, Download, Delete) */}
      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onDelete={handleDelete}
          onEdit={(d) => openEditModal(d)}
        />
      )}

      {/* Edit Document Metadata Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Document Metadata
                </h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDoc} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type
                </label>
                <select
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="rc">Registration Certificate (RC)</option>
                  <option value="insurance">Insurance Policy</option>
                  <option value="temp_registration">Temporary Registration (TR)</option>
                  <option value="form_20">Form 20</option>
                  <option value="form_21">Form 21</option>
                  <option value="form_22">Form 22</option>
                  <option value="showroom_invoice">Showroom Invoice</option>
                  <option value="noc">NOC</option>
                  <option value="form_35">Form 35</option>
                  <option value="hypothecation">Hypothecation Document</option>
                  <option value="aadhaar">Aadhaar Card / ID Proof</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. verified, transfer, rto_submitted"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional verification or office notes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editOcrVerified"
                  checked={editOcrVerified}
                  onChange={(e) => setEditOcrVerified(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="editOcrVerified" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark as Officially Verified / OCR Validated
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-4">
          <div className="w-full flex items-center justify-between text-white pb-3">
            <span className="font-bold text-sm">Capture RTO Paperwork / Document</span>
            <button onClick={stopCamera} className="p-2 text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-lg aspect-4/3 bg-black rounded-3xl overflow-hidden border border-white/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-amber-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="text-white/80 bg-black/50 px-3 py-1 rounded-full text-xs">
                Align document edges inside frame
              </span>
            </div>
          </div>

          <div className="w-full max-w-lg flex items-center justify-center py-6">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-amber-500 shadow-2xl flex items-center justify-center text-amber-600 active:scale-95 transition-transform"
              aria-label="Capture Document"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.docs.uploadTitle}
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="rc">Registration Certificate (RC)</option>
                  <option value="insurance">Insurance Policy</option>
                  <option value="temp_registration">Temporary Registration (TR)</option>
                  <option value="form_20">Form 20</option>
                  <option value="form_21">Form 21</option>
                  <option value="form_22">Form 22</option>
                  <option value="showroom_invoice">Showroom Invoice Copy (Ref)</option>
                  <option value="noc">NOC</option>
                  <option value="form_35">Form 35</option>
                  <option value="hypothecation">Hypothecation Document</option>
                  <option value="aadhaar">Aadhaar Card / ID Proof</option>
                  <option value="client_photo">Client Photograph</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Form 20 Application or HDFC Insurance 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Tractor / Machinery
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- No Tractor Link --</option>
                    {tractors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.registrationNumber || 'Unreg'} - {t.model} ({t.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Dealership / Showroom
                  </label>
                  <select
                    value={showroomId}
                    onChange={(e) => setShowroomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- No Showroom Link --</option>
                    {showrooms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Document File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required={!fileData}
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {fileName && (
                  <p className="text-xs text-emerald-600 mt-1 font-mono">Loaded: {fileName}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. transfer, loan_noc, vahan_submitted"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fileData}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save to Cabinet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
