import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ClipboardList,
  Plus,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Tractor,
  Building,
  RefreshCw,
  X,
  FileCheck,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { RTO_SERVICES } from '../utils/checklists.ts';
import { KARNATAKA_RTO_OFFICES } from '../utils/karnatakaRTO.ts';
import { DocumentViewerModal } from './DocumentViewerModal.tsx';
import { exportToCSV, exportToPDF } from '../utils/exporter.ts';

export const RTOCasesView: React.FC = () => {
  const { t, showToast, searchQuery, lang, confirm } = useApp();
  const [cases, setCases] = useState<any[]>([]);
  const [tractors, setTractors] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState<any | null>(null);
  const [activeCaseDetail, setActiveCaseDetail] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [showroomId, setShowroomId] = useState('');
  const [serviceType, setServiceType] = useState('new_registration');
  const [rtoOffice, setRtoOffice] = useState('KA-01 Bangalore Central (Koramangala)');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('Agent Karnataka');
  const [dueDate, setDueDate] = useState('');
  const [caseStatus, setCaseStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Custom checklist item form inside case detail
  const [customItemLabel, setCustomItemLabel] = useState('');
  const [customItemLabelKn, setCustomItemLabelKn] = useState('');

  const fetchCasesData = async () => {
    setLoading(true);
    try {
      const [casesRes, tractorsRes, showroomsRes] = await Promise.all([
        fetch(`/api/rto-cases?status=${statusFilter}&serviceType=${serviceFilter}`),
        fetch('/api/vehicles'),
        fetch('/api/showrooms'),
      ]);

      if (casesRes.ok) setCases(await casesRes.json());
      if (tractorsRes.ok) setTractors(await tractorsRes.json());
      if (showroomsRes.ok) setShowrooms(await showroomsRes.json());
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesData();
  }, [statusFilter, serviceFilter]);

  const openCreateModal = () => {
    setEditingCase(null);
    setVehicleId(tractors.length > 0 ? tractors[0].id.toString() : '');
    setShowroomId('');
    setServiceType('new_registration');
    setRtoOffice('KA-01 Bangalore Central (Koramangala)');
    setApplicationNumber('');
    setAssignedStaff('Agent Karnataka');
    setCaseStatus('pending');
    // Default due date: 7 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDueDate(d.toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (c: any) => {
    setEditingCase(c);
    setVehicleId(c.vehicleId ? c.vehicleId.toString() : '');
    setShowroomId(c.showroomId ? c.showroomId.toString() : '');
    setServiceType(c.serviceType || 'new_registration');
    setRtoOffice(c.rtoOffice || 'KA-01 Bangalore Central (Koramangala)');
    setApplicationNumber(c.applicationNumber || '');
    setAssignedStaff(c.assignedStaff || 'Agent Karnataka');
    setDueDate(c.dueDate ? c.dueDate.split('T')[0] : '');
    setCaseStatus(c.status || 'pending');
    setNotes(c.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteCase = (id: number) => {
    confirm({
      title: 'Delete RTO Work Case',
      message: 'Are you sure you want to permanently delete this RTO Case and its legal checklist? This action cannot be undone.',
      confirmText: 'Delete Case',
      variant: 'danger',
      onConfirm: async () => {
        const res = await fetch(`/api/rto-cases/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete RTO case');
        showToast('RTO Case deleted permanently', 'info');
        if (activeCaseDetail?.id === id) setActiveCaseDetail(null);
        fetchCasesData();
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!vehicleId && !editingCase) {
      setFormError('Please select a Tractor / Machinery record');
      return;
    }

    const selectedTractor = tractors.find((t) => t.id === parseInt(vehicleId, 10));

    setSaving(true);
    try {
      const payload = {
        clientId: selectedTractor?.clientId || editingCase?.clientId || 1,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : editingCase?.vehicleId,
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        serviceType,
        rtoOffice,
        status: caseStatus,
        applicationNumber: applicationNumber.trim(),
        assignedStaff: assignedStaff.trim(),
        dueDate,
        notes: notes.trim(),
      };

      const url = editingCase ? `/api/rto-cases/${editingCase.id}` : '/api/rto-cases';
      const method = editingCase ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save RTO case');

      showToast(
        editingCase
          ? `RTO Case ${editingCase.caseId} updated successfully`
          : `RTO Case ${data.caseId} created with official checklist`,
        'success'
      );
      setShowModal(false);
      setEditingCase(null);
      fetchCasesData();
      if (activeCaseDetail && activeCaseDetail.id === (editingCase?.id || data.id)) {
        setActiveCaseDetail((prev: any) => ({ ...prev, ...payload }));
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle checklist item completion
  const handleToggleChecklist = async (itemId: number, currentCompleted: boolean) => {
    try {
      const res = await fetch(`/api/case-checklists/${itemId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentCompleted, verifiedBy: 'Agent Official' }),
      });

      if (!res.ok) throw new Error('Failed to toggle checklist item');
      showToast(!currentCompleted ? 'Document verified' : 'Document marked unverified', 'info');
      fetchCasesData();

      // Update in activeCaseDetail modal
      if (activeCaseDetail) {
        setActiveCaseDetail((prev: any) => ({
          ...prev,
          checklists: prev.checklists.map((item: any) =>
            item.id === itemId ? { ...item, isCompleted: !currentCompleted } : item
          ),
        }));
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Add custom checklist item
  const handleAddCustomChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaseDetail || !customItemLabel.trim()) return;

    try {
      const res = await fetch(`/api/case-checklists/${activeCaseDetail.id}/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemLabel: customItemLabel.trim(),
          itemLabelKn: customItemLabelKn.trim() || customItemLabel.trim(),
          isMandatory: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to add custom checklist item');
      const newItem = await res.json();
      showToast('Custom document requirement added to checklist', 'success');
      setCustomItemLabel('');
      setCustomItemLabelKn('');
      setActiveCaseDetail((prev: any) => ({
        ...prev,
        checklists: [...(prev.checklists || []), newItem],
      }));
      fetchCasesData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Update case status
  const handleStatusChange = async (caseId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/rto-cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update case status');
      showToast(`Case status updated to ${newStatus}`, 'success');
      fetchCasesData();
      if (activeCaseDetail && activeCaseDetail.id === caseId) {
        setActiveCaseDetail((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.caseId.toLowerCase().includes(q) ||
      c.rtoOffice.toLowerCase().includes(q) ||
      c.clientName?.toLowerCase().includes(q) ||
      c.vehicleReg?.toLowerCase().includes(q) ||
      c.applicationNumber?.toLowerCase().includes(q) ||
      c.serviceType.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (filteredCases.length === 0) {
      showToast('No RTO cases to export for current filter', 'info');
      return;
    }

    const headers = [
      'Case ID',
      'Service Type',
      'Farmer / Owner Name',
      'Owner Mobile',
      'Tractor Reg / Status',
      'Make / Model',
      'Chassis Number',
      'Karnataka RTO Office',
      'Parivahan App No',
      'Assigned Staff',
      'Due Date',
      'Checklist Progress',
      'Case Status',
    ];

    const rows = filteredCases.map((c) => {
      const completedCount = c.checklists?.filter((i: any) => i.isCompleted).length || 0;
      const totalCount = c.checklists?.length || 0;
      const progress = totalCount > 0 ? `${completedCount}/${totalCount} (${Math.round((completedCount / totalCount) * 100)}%)` : '0/0';

      return [
        c.caseId,
        c.serviceType.replace(/_/g, ' ').toUpperCase(),
        c.clientName || 'N/A',
        c.clientPhone || 'N/A',
        c.vehicleReg || 'Unregistered',
        c.vehicleModel || 'N/A',
        c.chassisNumber || 'N/A',
        c.rtoOffice || 'N/A',
        c.applicationNumber || 'Pending',
        c.assignedStaff || 'N/A',
        c.dueDate || 'N/A',
        progress,
        c.status.toUpperCase(),
      ];
    });

    exportToCSV({
      filename: `Karnataka_RTO_Cases_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
    });
    showToast(`Exported ${filteredCases.length} RTO cases to CSV`, 'success');
  };

  const handleExportPDF = () => {
    if (filteredCases.length === 0) {
      showToast('No RTO cases to export for current filter', 'info');
      return;
    }

    const headers = [
      'Case ID',
      'Service',
      'Farmer / Owner',
      'Tractor / Reg',
      'RTO Office',
      'App No',
      'Staff',
      'Due Date',
      'Checklist',
      'Status',
    ];

    const rows = filteredCases.map((c) => {
      const completedCount = c.checklists?.filter((i: any) => i.isCompleted).length || 0;
      const totalCount = c.checklists?.length || 0;
      const progress = totalCount > 0 ? `${completedCount}/${totalCount}` : '-';

      return [
        c.caseId,
        c.serviceType.replace(/_/g, ' ').toUpperCase(),
        c.clientName || '-',
        c.vehicleReg || c.vehicleModel || '-',
        c.rtoOffice || '-',
        c.applicationNumber || 'Pending',
        c.assignedStaff || '-',
        c.dueDate || '-',
        progress,
        c.status.toUpperCase(),
      ];
    });

    exportToPDF({
      filename: `Karnataka_RTO_Cases_${new Date().toISOString().split('T')[0]}`,
      title: 'Karnataka RTO Work Cases Register',
      subtitle: 'Official Tractors & Farm Machinery Parivahan Sewa Worklist',
      headers,
      rows,
      metadata: {
        'Status Filter': statusFilter === 'all' ? 'All Statuses' : statusFilter.toUpperCase(),
        'Service Filter': serviceFilter === 'all' ? 'All Services' : serviceFilter.toUpperCase(),
        'Total Filtered Records': filteredCases.length,
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
            <ClipboardList className="w-5 h-5 text-amber-600" />
            {t.rto.title}
          </h2>
          <p className="text-xs text-slate-500">
            End-to-end Karnataka RTO service tracking with auto-generated legal checklists
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border-0 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_documents">Waiting for Docs</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Export Actions */}
          <button
            onClick={handleExportCSV}
            title="Download filtered cases as CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            title="Print or Save filtered cases as PDF report"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            {t.rto.addNew}
          </button>
        </div>
      </div>

      {/* RTO Cases List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                      {c.caseId}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                      {c.serviceType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {c.rtoOffice}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {c.clientName ? `Farmer: ${c.clientName}` : 'Farmer'} • {c.vehicleReg || 'Unregistered'} ({c.vehicleModel || 'Tractor / Machinery'})
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    {c.applicationNumber && (
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        App No: {c.applicationNumber}
                      </span>
                    )}
                    <span>Staff: {c.assignedStaff || 'Agent'}</span>
                    <span>Target Due: {c.dueDate ? c.dueDate.split('T')[0] : 'ASAP'}</span>
                  </div>
                </div>

                {/* Checklist Progress Bar & Actions */}
                <div className="flex items-center gap-3 shrink-0 justify-between lg:justify-end flex-wrap">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-20 sm:w-28 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${c.checklistProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {c.checklistProgress}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Checklist verified
                    </span>
                  </div>

                  {/* Status badge and action buttons */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        c.status === 'completed'
                          ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                          : c.status === 'in_progress'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => setActiveCaseDetail(c)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 inline-flex items-center gap-1"
                      title="Inspect Legal Checklist & Documents"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Checklist
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                      title="Edit RTO Case"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCase(c.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete RTO Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No RTO work cases found.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "Create RTO Work Case" to initiate paperwork for registration, transfer, or NOC.
            </p>
          </div>
        )}
      </div>

      {/* Case Detail & Checklist Drawer Modal */}
      {activeCaseDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {activeCaseDetail.caseId} • {activeCaseDetail.serviceType.replace(/_/g, ' ').toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeCaseDetail.rtoOffice}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: {activeCaseDetail.clientName} • Vehicle: {activeCaseDetail.vehicleReg || 'Unregistered'}
                </p>
              </div>
              <button
                onClick={() => setActiveCaseDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Change Selector */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Update Case Status:
              </span>
              <div className="flex items-center gap-1.5">
                {(['pending', 'in_progress', 'waiting_for_documents', 'completed'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(activeCaseDetail.id, st)}
                      className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] transition-all ${
                        activeCaseDetail.status === st
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Checklist Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  {lang === 'kn' ? t.rto.checklistKn : t.rto.checklist}
                </h4>
                <span className="text-xs text-slate-400">
                  Click checkbox to verify document presence
                </span>
              </div>

              <div className="space-y-2">
                {activeCaseDetail.checklists && activeCaseDetail.checklists.length > 0 ? (
                  activeCaseDetail.checklists.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id, item.isCompleted)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        item.isCompleted
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <p className={`font-semibold ${item.isCompleted ? 'line-through opacity-80' : ''}`}>
                            {lang === 'kn' && item.itemLabelKn ? item.itemLabelKn : item.itemLabel}
                          </p>
                          {lang === 'kn' && item.itemLabelKn && (
                            <p className="text-[10px] text-slate-400">{item.itemLabel}</p>
                          )}
                          {item.verifiedBy && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              Verified by: {item.verifiedBy}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.isMandatory
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isMandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No checklist items generated.</p>
                )}
              </div>

              {/* Add Custom Checklist Item */}
              <form onSubmit={handleAddCustomChecklist} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom required document (e.g. Affidavit / Clearance letter)"
                  value={customItemLabel}
                  onChange={(e) => setCustomItemLabel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!customItemLabel.trim()}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Add Requirement
                </button>
              </form>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveCaseDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create RTO Case Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingCase ? <Edit2 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-amber-600" />}
                {editingCase ? `Edit RTO Case: ${editingCase.caseId}` : t.rto.addNew}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tractor / Machinery & Farmer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Tractor Record --</option>
                    {tractors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.registrationNumber || 'Unreg'} - {t.model} ({t.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Showroom / Dealership (Optional)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Karnataka RTO Service Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {RTO_SERVICES.map((s) => (
                      <option key={s.type} value={s.type}>
                        {lang === 'kn' ? `${s.labelKn} (${s.label})` : s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Case Status
                  </label>
                  <select
                    value={caseStatus}
                    onChange={(e) => setCaseStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_documents">Waiting for Documents</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Karnataka RTO Office <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rtoOffice}
                  onChange={(e) => setRtoOffice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {KARNATAKA_RTO_OFFICES.map((off) => (
                    <option key={off.code} value={`${off.code} ${off.name}`}>
                      {off.code} - {off.name} ({off.nameKn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vahan / RTO App No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KA261021204899"
                    value={applicationNumber}
                    onChange={(e) => setApplicationNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Agent / Staff
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Agent Karnataka"
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Commercial clearance required, loan NOC verified..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingCase ? 'Save Changes' : 'Create Case & Generate Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal for case attachments */}
      {previewDoc && (
        <DocumentViewerModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
