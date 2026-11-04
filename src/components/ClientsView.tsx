import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Shield,
  Car,
  FileText,
  AlertCircle,
  Eye,
  Edit2,
  Archive,
  RefreshCw,
  X,
  CheckCircle2,
  Calendar,
  Download,
  CheckSquare,
  Square,
  PackageCheck,
} from 'lucide-react';
import { isValidIndianMobile, maskAadhaar } from '../utils/validators.ts';
import { downloadDocumentsAsZip } from '../utils/zipDownloader.ts';
import { fetchJson } from '../utils/apiClient.ts';

export const ClientsView: React.FC = () => {
  const { t, showToast, searchQuery, selectedEntityForView, setSelectedEntityForView, confirm } = useApp();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [clientSelectedDocIds, setClientSelectedDocIds] = useState<number[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarRaw, setAadhaarRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<any[]>(`/api/clients?status=${statusFilter}`, { fallback: [] });
      setClients(data || []);

      if (selectedEntityForView && selectedEntityForView.type === 'client') {
        fetchClientProfile(selectedEntityForView.id);
        setSelectedEntityForView(null);
      }
    } catch (err: any) {
      console.warn('fetchClients error:', err);
      showToast(err.message || 'Failed to fetch clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientProfile = async (id: number | string) => {
    try {
      const data = await fetchJson<any>(`/api/clients/${id}`);
      setViewingProfile(data);
      if (data?.documents && Array.isArray(data.documents)) {
        setClientSelectedDocIds(data.documents.map((d: any) => d.id));
      } else {
        setClientSelectedDocIds([]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch client profile', 'error');
    }
  };

  const toggleClientDocSelection = (docId: number) => {
    setClientSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleSelectAllClientDocs = () => {
    if (!viewingProfile?.documents) return;
    if (clientSelectedDocIds.length === viewingProfile.documents.length) {
      setClientSelectedDocIds([]);
    } else {
      setClientSelectedDocIds(viewingProfile.documents.map((d: any) => d.id));
    }
  };

  const handleDownloadClientZip = async () => {
    if (!viewingProfile || !viewingProfile.documents || viewingProfile.documents.length === 0) {
      showToast('No documents uploaded for this client yet', 'error');
      return;
    }

    const docIds = clientSelectedDocIds.length > 0
      ? clientSelectedDocIds
      : viewingProfile.documents.map((d: any) => d.id);

    setDownloadingZip(true);
    try {
      const result = await downloadDocumentsAsZip({
        docIds,
        entityType: 'client',
        entityId: viewingProfile.clientId,
        entityName: viewingProfile.fullName,
      });
      showToast(`Downloaded offline dossier with ${result.count} documents!`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFullName('');
    setMobileNumber('');
    setAlternateMobile('');
    setAddress('Karnataka, India');
    setAadhaarRaw('');
    setNotes('');
    setAadhaarDocUrl('');
    setPhotoUrl('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFullName(client.fullName);
    setMobileNumber(client.mobileNumber);
    setAlternateMobile(client.alternateMobile || '');
    setAddress(client.address);
    setAadhaarRaw(client.aadhaarLastFour ? client.aadhaarLastFour.slice(-4) : '');
    setNotes(client.notes || '');
    setAadhaarDocUrl(client.aadhaarDocUrl || '');
    setPhotoUrl(client.photoUrl || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Please enter client full name');
      return;
    }
    if (!isValidIndianMobile(mobileNumber)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        alternateMobile: alternateMobile.trim(),
        address: address.trim(),
        aadhaarRaw: aadhaarRaw.trim(),
        notes: notes.trim(),
        aadhaarDocUrl,
        photoUrl,
      };

      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const data = await fetchJson<any>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      showToast(editingClient ? 'Client updated successfully' : 'Client created successfully', 'success');
      setShowModal(false);
      fetchClients();
      if (viewingProfile && viewingProfile.id === (editingClient?.id || data?.id)) {
        fetchClientProfile(editingClient?.id || data?.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = (id: number) => {
    confirm({
      title: 'Archive / Delete Farmer Profile',
      message: 'Are you sure you want to archive or delete this farmer/client profile?',
      confirmText: 'Delete Record',
      variant: 'danger',
      onConfirm: async () => {
        await fetchJson(`/api/clients/${id}`, { method: 'DELETE' });
        showToast('Client record archived', 'info');
        fetchClients();
        if (viewingProfile?.id === id) setViewingProfile(null);
      },
    });
  };

  // Filter clients based on search
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.mobileNumber.toLowerCase().includes(q) ||
      c.clientId.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            {t.clients.title}
          </h2>
          <p className="text-xs text-slate-500">
            Secure client directory with UIDAI Aadhaar masking & vehicle history
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.common.active}
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'archived'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.common.archived}
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.clients.addNew}
          </button>
        </div>
      </div>

      {/* Client List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t.clients.clientId}</th>
                  <th className="py-3 px-4">{t.clients.fullName}</th>
                  <th className="py-3 px-4">{t.clients.mobileNumber}</th>
                  <th className="py-3 px-4">Aadhaar (UIDAI Masked)</th>
                  <th className="py-3 px-4">{t.clients.address}</th>
                  <th className="py-3 px-4">{t.common.status}</th>
                  <th className="py-3 px-4 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {client.clientId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {client.fullName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {client.mobileNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {client.aadhaarLastFour || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {client.address}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          client.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => fetchClientProfile(client.id)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="View complete profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit client"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {client.status === 'active' && (
                          <button
                            onClick={() => handleArchive(client.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Archive client"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">{t.clients.noClients}</p>
          </div>
        )}
      </div>

      {/* Client Profile Modal / Drawer */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {viewingProfile.clientId}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {viewingProfile.fullName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5" /> {viewingProfile.mobileNumber}
                  {viewingProfile.alternateMobile && ` • Alt: ${viewingProfile.alternateMobile}`}
                </p>
              </div>
              <button
                onClick={() => setViewingProfile(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Personal Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <div>
                <span className="text-slate-400 block font-medium">Aadhaar (Masked)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {viewingProfile.aadhaarLastFour || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Registration Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(viewingProfile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Address</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {viewingProfile.address}
                </span>
              </div>
              {viewingProfile.notes && (
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Notes</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {viewingProfile.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Linked Vehicles */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-600" />
                Linked Vehicles ({viewingProfile.vehicles?.length || 0})
              </h4>
              {viewingProfile.vehicles && viewingProfile.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewingProfile.vehicles.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-850"
                    >
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {v.registrationNumber || 'Unregistered (New)'}
                      </span>
                      <p className="text-slate-500 font-medium">
                        {v.manufacturer} {v.model} ({v.manufacturingYear})
                      </p>
                      <p className="font-mono text-[10px] text-slate-400 mt-1">
                        Chassis: {v.chassisNumber}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No vehicles linked to this client yet.</p>
              )}
            </div>

            {/* Linked RTO Cases */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                RTO Work History & Active Cases ({viewingProfile.cases?.length || 0})
              </h4>
              {viewingProfile.cases && viewingProfile.cases.length > 0 ? (
                <div className="space-y-2">
                  {viewingProfile.cases.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white mr-2">
                          {c.caseId}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                          {c.serviceType.replace('_', ' ')}
                        </span>
                        <p className="text-slate-500 mt-0.5">{c.rtoOffice}</p>
                      </div>
                      <span className="text-xs font-bold capitalize text-slate-600 dark:text-slate-300">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No RTO cases registered for this client.</p>
              )}
            </div>

            {/* Uploaded Documents */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Client Documents ({viewingProfile.documents?.length || 0})
                </h4>

                {viewingProfile.documents && viewingProfile.documents.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={toggleSelectAllClientDocs}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    >
                      {clientSelectedDocIds.length === viewingProfile.documents.length && viewingProfile.documents.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>
                        {clientSelectedDocIds.length === viewingProfile.documents.length
                          ? t.docs.deselectAll || 'Deselect All'
                          : t.docs.selectAll || 'Select All'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadClientZip}
                      disabled={downloadingZip}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      title="Download selected client documents as a single offline ZIP file"
                    >
                      {downloadingZip ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>
                        Download Dossier ({clientSelectedDocIds.length > 0 ? clientSelectedDocIds.length : viewingProfile.documents.length} ZIP)
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {viewingProfile.documents && viewingProfile.documents.length > 0 ? (
                <div className="space-y-2">
                  {viewingProfile.documents.map((d: any) => {
                    const isSelected = clientSelectedDocIds.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleClientDocSelection(d.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled via row click
                            className="w-4 h-4 text-purple-600 rounded-sm border-slate-300 focus:ring-purple-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {d.title}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md ml-2">
                              {d.docType}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              v{d.version} • {d.fileName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {new Date(d.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {(d.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic p-3 border border-dashed rounded-xl text-center">
                  No documents uploaded for this client yet.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewingProfile(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClient ? 'Edit Client Details' : t.clients.addNew}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Gouda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alternate Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address in Karnataka <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="#12, 4th Cross, Koramangala, Bengaluru, Karnataka - 560034"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Aadhaar Last 4 Digits (or Full Number)
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    UIDAI Compliant Masking
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="e.g. 9012 (only last 4 stored)"
                  value={aadhaarRaw}
                  onChange={(e) => setAadhaarRaw(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  System automatically masks all digits except the last 4: e.g. XXXX-XXXX-9012.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Special instructions or paperwork preferences"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
