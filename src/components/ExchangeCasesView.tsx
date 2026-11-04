import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ArrowLeftRight,
  Plus,
  Tractor,
  Store,
  User,
  CheckCircle2,
  Clock,
  QrCode,
  FileText,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const ExchangeCasesView: React.FC = () => {
  const { t, showToast, searchQuery, confirm } = useApp();
  const [exchangeCases, setExchangeCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState<any | null>(null);
  const [qrModalExchange, setQrModalExchange] = useState<any | null>(null);

  // Form states
  const [clientId, setClientId] = useState('');
  const [showroomId, setShowroomId] = useState('');
  const [oldVehicleId, setOldVehicleId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [oldOwnerName, setOldOwnerName] = useState('');
  const [oldOwnerMobile, setOldOwnerMobile] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerMobile, setNewOwnerMobile] = useState('');
  const [transferStatus, setTransferStatus] = useState('pending');
  const [newRegStatus, setNewRegStatus] = useState('pending');
  const [handoverPaperworkStatus, setHandoverPaperworkStatus] = useState('pending');
  const [pendingSignatures, setPendingSignatures] = useState('Form 29/30 signature pending from seller');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchExchangeData = async () => {
    setLoading(true);
    try {
      const [exRes, cRes, sRes, vRes] = await Promise.all([
        fetch('/api/exchange-cases'),
        fetch('/api/clients?status=active'),
        fetch('/api/showrooms'),
        fetch('/api/vehicles'),
      ]);

      if (exRes.ok) setExchangeCases(await exRes.json());
      if (cRes.ok) setClients(await cRes.json());
      if (sRes.ok) setShowrooms(await sRes.json());
      if (vRes.ok) setVehicles(await vRes.json());
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeData();
  }, []);

  const openCreateModal = () => {
    setEditingCase(null);
    setClientId('');
    setShowroomId(showrooms.length > 0 ? showrooms[0].id.toString() : '');
    setOldVehicleId('');
    setNewVehicleId('');
    setOldOwnerName('');
    setOldOwnerMobile('');
    setNewOwnerName('');
    setNewOwnerMobile('');
    setTransferStatus('pending');
    setNewRegStatus('pending');
    setHandoverPaperworkStatus('pending');
    setPendingSignatures('Form 29/30 signatures & bank NOC');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (exc: any) => {
    setEditingCase(exc);
    setClientId(exc.clientId ? exc.clientId.toString() : '');
    setShowroomId(exc.showroomId ? exc.showroomId.toString() : '');
    setOldVehicleId(exc.oldVehicleId ? exc.oldVehicleId.toString() : '');
    setNewVehicleId(exc.newVehicleId ? exc.newVehicleId.toString() : '');
    setOldOwnerName(exc.oldOwnerName || '');
    setOldOwnerMobile(exc.oldOwnerMobile || '');
    setNewOwnerName(exc.newOwnerName || '');
    setNewOwnerMobile(exc.newOwnerMobile || '');
    setTransferStatus(exc.transferStatus || 'pending');
    setNewRegStatus(exc.newRegStatus || 'pending');
    setHandoverPaperworkStatus(exc.handoverPaperworkStatus || 'pending');
    setPendingSignatures(exc.pendingSignatures || '');
    setNotes(exc.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteCase = (id: number) => {
    confirm({
      title: 'Delete Exchange Case',
      message: 'Are you sure you want to permanently delete this exchange case? This action cannot be undone.',
      confirmText: 'Delete Case',
      variant: 'danger',
      onConfirm: async () => {
        const res = await fetch(`/api/exchange-cases/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete exchange case');
        showToast('Exchange case deleted', 'info');
        fetchExchangeData();
      },
    });
  };

  const handleOldVehicleChange = (vId: string) => {
    setOldVehicleId(vId);
    const selected = vehicles.find((v) => v.id.toString() === vId);
    if (selected) {
      setOldOwnerName(selected.ownerName);
      setOldOwnerMobile(selected.ownerMobile || '');
    }
  };

  const handleNewVehicleChange = (vId: string) => {
    setNewVehicleId(vId);
    const selected = vehicles.find((v) => v.id.toString() === vId);
    if (selected) {
      setNewOwnerName(selected.ownerName);
      setNewOwnerMobile(selected.ownerMobile || '');
    }
  };

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const selected = clients.find((c) => c.id.toString() === cId);
    if (selected && !newOwnerName) {
      setNewOwnerName(selected.fullName);
      setNewOwnerMobile(selected.mobileNumber);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!clientId || !showroomId || !oldVehicleId || !newVehicleId) {
      setFormError('Please select Client, Showroom, Old Vehicle, and New Vehicle');
      return;
    }
    if (oldVehicleId === newVehicleId) {
      setFormError('Old vehicle and New vehicle cannot be the same record');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: parseInt(clientId, 10),
        showroomId: parseInt(showroomId, 10),
        oldVehicleId: parseInt(oldVehicleId, 10),
        newVehicleId: parseInt(newVehicleId, 10),
        oldOwnerName: oldOwnerName.trim(),
        oldOwnerMobile: oldOwnerMobile.trim(),
        newOwnerName: newOwnerName.trim(),
        newOwnerMobile: newOwnerMobile.trim(),
        transferStatus,
        newRegStatus,
        handoverPaperworkStatus,
        pendingSignatures: pendingSignatures.trim(),
        notes: notes.trim(),
      };

      const url = editingCase ? `/api/exchange-cases/${editingCase.id}` : '/api/exchange-cases';
      const method = editingCase ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save exchange case');

      showToast(editingCase ? 'Exchange case updated' : 'Exchange case created successfully', 'success');
      setShowModal(false);
      fetchExchangeData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCases = exchangeCases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.exchangeId.toLowerCase().includes(q) ||
      c.clientName?.toLowerCase().includes(q) ||
      c.showroomName?.toLowerCase().includes(q) ||
      c.oldVehicle?.registrationNumber?.toLowerCase().includes(q) ||
      c.newVehicle?.registrationNumber?.toLowerCase().includes(q) ||
      c.oldVehicle?.model?.toLowerCase().includes(q) ||
      c.newVehicle?.model?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {t.exchanges.title}
          </h2>
          <p className="text-xs text-slate-500">
            Unified side-by-side management for Old Vehicle trade-in and New Vehicle registration
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t.exchanges.addNew}
        </button>
      </div>

      {/* Exchange Cases Grid */}
      {loading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : filteredCases.length > 0 ? (
        <div className="space-y-4">
          {filteredCases.map((exc) => (
            <div
              key={exc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {exc.exchangeId}
                  </span>
                  {exc.isTractorExchange && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <Tractor className="w-3 h-3" /> Tractor Exchange
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    Client: <strong className="text-slate-800 dark:text-slate-200">{exc.clientName}</strong> • Showroom: <strong className="text-slate-800 dark:text-slate-200">{exc.showroomName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      exc.status === 'completed'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {exc.status}
                  </span>
                  {exc.qrCode && (
                    <button
                      onClick={() => setQrModalExchange(exc)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                      title="View Exchange QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(exc)}
                    className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                    title="Edit Exchange Case"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCase(exc.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete Exchange Case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Unified View of Old and New Tractors & Machineries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {/* Old Tractor (Trade-In / Transfer) */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                      <Tractor className="w-4 h-4" /> Old Tractor / Equipment (Trade-In)
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exc.oldVehicle?.registrationNumber || 'KA Reg'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {exc.oldVehicle?.manufacturer} {exc.oldVehicle?.model} ({exc.oldVehicle?.manufacturingYear})
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>Seller / Farmer: {exc.oldOwnerName} ({exc.oldOwnerMobile || '—'})</p>
                    <p className="font-mono text-[11px]">Chassis: {exc.oldVehicle?.chassisNumber}</p>
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Ownership Transfer:</span>
                    <span className="font-bold capitalize text-amber-700 dark:text-amber-400">
                      {exc.transferStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* New Tractor (Delivery / Registration) */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <Tractor className="w-4 h-4" /> New Tractor / Equipment (Delivery)
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exc.newVehicle?.registrationNumber || 'Unregistered (New)'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {exc.newVehicle?.manufacturer} {exc.newVehicle?.model} ({exc.newVehicle?.manufacturingYear})
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>Buyer / New Owner: {exc.newOwnerName} ({exc.newOwnerMobile || '—'})</p>
                    <p className="font-mono text-[11px]">Chassis: {exc.newVehicle?.chassisNumber}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                    <span className="text-slate-500">New Registration:</span>
                    <span className="font-bold capitalize text-emerald-700 dark:text-emerald-400">
                      {exc.newRegStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Handover paperwork & Pending Signatures */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="text-slate-500">Handover Paperwork Status:</span>{' '}
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {exc.handoverPaperworkStatus}
                  </span>
                  {exc.pendingSignatures && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pending: {exc.pendingSignatures}
                    </p>
                  )}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Created: {new Date(exc.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
          <p className="text-sm font-semibold">No exchange cases registered.</p>
          <p className="text-xs text-slate-500 mt-1">
            Create an exchange case when a customer trades in an old vehicle for showroom delivery.
          </p>
        </div>
      )}

      {/* QR Modal */}
      {qrModalExchange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono font-bold text-purple-600">
                {qrModalExchange.exchangeId}
              </span>
              <button
                onClick={() => setQrModalExchange(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Exchange Case QR Code
            </h3>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-xs">
              <img
                src={qrModalExchange.qrCode}
                alt="Exchange QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-[11px] text-slate-400 px-4">
              Authorized Karnataka RTO verification token linking old vehicle trade-in and new delivery.
            </p>
          </div>
        </div>
      )}

      {/* Create Exchange Case Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Exchange Case
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
                    Customer / Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.mobileNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Showroom <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={showroomId}
                    onChange={(e) => setShowroomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Showroom --</option>
                    {showrooms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.showroomId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Old Vehicle and New Vehicle selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 space-y-2">
                  <label className="block font-bold text-amber-800 dark:text-amber-400">
                    Old Vehicle (Trade-In) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={oldVehicleId}
                    onChange={(e) => handleOldVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Old Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber || v.vehicleId} - {v.manufacturer} {v.model} ({v.ownerName})
                      </option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="text"
                      placeholder="Old Owner Name"
                      value={oldOwnerName}
                      onChange={(e) => setOldOwnerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Old Owner Mobile"
                      value={oldOwnerMobile}
                      onChange={(e) => setOldOwnerMobile(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
                  <label className="block font-bold text-emerald-800 dark:text-emerald-400">
                    New Vehicle (Delivery) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newVehicleId}
                    onChange={(e) => handleNewVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select New Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber || 'Unregistered'} - {v.manufacturer} {v.model} ({v.chassisNumber.slice(-6)})
                      </option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="text"
                      placeholder="New Owner / Customer Name"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="New Owner Mobile"
                      value={newOwnerMobile}
                      onChange={(e) => setNewOwnerMobile(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status and pending signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer Status
                  </label>
                  <select
                    value={transferStatus}
                    onChange={(e) => setTransferStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="submitted_to_rto">Submitted to RTO</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Reg Status
                  </label>
                  <select
                    value={newRegStatus}
                    onChange={(e) => setNewRegStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="docs_collected">Docs Collected</option>
                    <option value="submitted_to_rto">Submitted to RTO</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Handover Paperwork
                  </label>
                  <select
                    value={handoverPaperworkStatus}
                    onChange={(e) => setHandoverPaperworkStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="signed">Signed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pending Signatures / Clearances
                </label>
                <input
                  type="text"
                  placeholder="e.g. Form 29/30 signature from seller, Bank loan NOC pending"
                  value={pendingSignatures}
                  onChange={(e) => setPendingSignatures(e.target.value)}
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Create Exchange Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
