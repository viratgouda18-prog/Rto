import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Store,
  Plus,
  Phone,
  Mail,
  MapPin,
  Tractor,
  ArrowLeftRight,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { isValidIndianMobile } from '../utils/validators.ts';
import { fetchJson } from '../utils/apiClient.ts';

export const ShowroomsView: React.FC = () => {
  const { t, showToast, searchQuery, selectedEntityForView, setSelectedEntityForView, confirm } = useApp();
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState<any | null>(null);
  const [activeShowroomDetail, setActiveShowroomDetail] = useState<any | null>(null);
  const [subTab, setSubTab] = useState<'new' | 'used' | 'exchange'>('new');

  // Form fields
  const [name, setName] = useState('');
  const [dealershipType, setDealershipType] = useState<'automobile' | 'tractor'>('automobile');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchShowrooms = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<any[]>('/api/showrooms', { fallback: [] });
      setShowrooms(data || []);

      if (selectedEntityForView && selectedEntityForView.type === 'showroom') {
        openShowroomDetail(selectedEntityForView.id);
        setSelectedEntityForView(null);
      }
    } catch (err: any) {
      console.warn('fetchShowrooms error:', err);
      showToast(err.message || 'Failed to load showrooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openShowroomDetail = async (id: number | string) => {
    try {
      const data = await fetchJson<any>(`/api/showrooms/${id}`);
      setActiveShowroomDetail(data);
      setSubTab('new');
    } catch (err: any) {
      showToast(err.message || 'Failed to load showroom paperwork', 'error');
    }
  };

  useEffect(() => {
    fetchShowrooms();
  }, []);

  const openCreateModal = () => {
    setEditingShowroom(null);
    setName('');
    setDealershipType('automobile');
    setContactPerson('');
    setMobileNumber('');
    setEmail('');
    setAddress('Bengaluru, Karnataka');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (sr: any) => {
    setEditingShowroom(sr);
    setName(sr.name);
    setDealershipType(sr.dealershipType === 'tractor' ? 'tractor' : 'automobile');
    setContactPerson(sr.contactPerson || '');
    setMobileNumber(sr.mobileNumber);
    setEmail(sr.email || '');
    setAddress(sr.address);
    setNotes(sr.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Showroom name is required');
      return;
    }
    if (!isValidIndianMobile(mobileNumber)) {
      setFormError('Valid 10-digit mobile number is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        dealershipType,
        contactPerson: contactPerson.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
      };

      const url = editingShowroom ? `/api/showrooms/${editingShowroom.id}` : '/api/showrooms';
      const method = editingShowroom ? 'PUT' : 'POST';

      const data = await fetchJson<any>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      showToast(editingShowroom ? 'Showroom updated' : 'Showroom added successfully', 'success');
      setShowModal(false);
      fetchShowrooms();
      if (activeShowroomDetail && activeShowroomDetail.id === (editingShowroom?.id || data?.id)) {
        openShowroomDetail(editingShowroom?.id || data?.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save showroom');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShowroom = (id: number) => {
    confirm({
      title: 'Delete Dealership / Showroom',
      message: 'Are you sure you want to permanently delete this dealership / showroom? Associated inventory linkages will be unassigned.',
      confirmText: 'Delete Showroom',
      variant: 'danger',
      onConfirm: async () => {
        await fetchJson(`/api/showrooms/${id}`, { method: 'DELETE' });
        showToast('Showroom deleted permanently', 'info');
        fetchShowrooms();
        if (activeShowroomDetail?.id === id) setActiveShowroomDetail(null);
      },
    });
  };

  const filteredShowrooms = showrooms.filter((sr) => {
    const q = searchQuery.toLowerCase();
    return (
      sr.name.toLowerCase().includes(q) ||
      sr.showroomId.toLowerCase().includes(q) ||
      sr.contactPerson.toLowerCase().includes(q) ||
      sr.mobileNumber.toLowerCase().includes(q) ||
      sr.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {t.showrooms.title}
          </h2>
          <p className="text-xs text-slate-500">
            Separate paperwork vaults for New Vehicles, Used Vehicles, and Exchange Cases
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t.showrooms.addNew}
        </button>
      </div>

      {/* Showroom Cards Grid */}
      {loading ? (
        <div className="py-12 flex justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : filteredShowrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShowrooms.map((sr) => (
            <div
              key={sr.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                      {sr.showroomId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        sr.dealershipType === 'tractor'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {sr.dealershipType === 'tractor' ? (
                        <>
                          <Tractor className="w-3 h-3" /> Tractor Dealer
                        </>
                      ) : (
                        <>
                          <Store className="w-3 h-3" /> Machinery Dealer
                        </>
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      sr.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {sr.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                  {sr.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {sr.mobileNumber} • {sr.contactPerson || 'Manager'}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {sr.address}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => openShowroomDetail(sr.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Paperwork
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(sr)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                    title="Edit showroom"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteShowroom(sr.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete showroom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
          <p className="text-sm font-semibold">No showrooms added yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Create dealer records (e.g. Advaith Hyundai, Mandovi Motors) to categorize paperwork.
          </p>
        </div>
      )}

      {/* Showroom Detail Modal with 3 Categories: New Vehicles, Used Vehicles, Exchange Cases */}
      {activeShowroomDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {activeShowroomDetail.showroomId}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeShowroomDetail.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeShowroomDetail.address} • Contact: {activeShowroomDetail.contactPerson} (
                  {activeShowroomDetail.mobileNumber})
                </p>
              </div>
              <button
                onClick={() => setActiveShowroomDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Categories Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
              <button
                onClick={() => setSubTab('new')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  subTab === 'new'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Tractor className="w-4 h-4" />
                Category A: {t.showrooms.tabNewVehicles} ({activeShowroomDetail.newVehicles?.length || 0})
              </button>
              <button
                onClick={() => setSubTab('used')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  subTab === 'used'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Tractor className="w-4 h-4" />
                Category B: {t.showrooms.tabUsedVehicles} ({activeShowroomDetail.usedVehicles?.length || 0})
              </button>
              <button
                onClick={() => setSubTab('exchange')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  subTab === 'exchange'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Category C: {t.showrooms.tabExchangeCases} ({activeShowroomDetail.exchangeCases?.length || 0})
              </button>
            </div>

            {/* Sub Tab Content */}
            {subTab === 'new' && (
              <div className="space-y-3">
                {activeShowroomDetail.newVehicles && activeShowroomDetail.newVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeShowroomDetail.newVehicles.map((v: any) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {v.registrationNumber || 'Unregistered (New)'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                            {v.fuelType}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {v.manufacturer} {v.model} ({v.manufacturingYear})
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 mt-1">
                          Chassis: {v.chassisNumber} • Engine: {v.engineNumber}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Owner: {v.ownerName} ({v.ownerMobile})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No new vehicle paperwork logged for this showroom.
                  </div>
                )}
              </div>
            )}

            {subTab === 'used' && (
              <div className="space-y-3">
                {activeShowroomDetail.usedVehicles && activeShowroomDetail.usedVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeShowroomDetail.usedVehicles.map((v: any) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {v.registrationNumber || 'Reg Pending'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                            Used
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white mt-1">
                          {v.manufacturer} {v.model} ({v.manufacturingYear})
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 mt-1">
                          Chassis: {v.chassisNumber}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Previous Owner: {v.ownerName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No used vehicle paperwork logged for this showroom.
                  </div>
                )}
              </div>
            )}

            {subTab === 'exchange' && (
              <div className="space-y-3">
                {activeShowroomDetail.exchangeCases && activeShowroomDetail.exchangeCases.length > 0 ? (
                  <div className="space-y-2">
                    {activeShowroomDetail.exchangeCases.map((exc: any) => (
                      <div
                        key={exc.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {exc.exchangeId}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                            Transfer: {exc.transferStatus} • New Reg: {exc.newRegStatus}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pending: {exc.pendingSignatures || 'None'}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {exc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No exchange cases registered for this showroom.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveShowroomDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Showroom Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingShowroom ? 'Edit Showroom' : t.showrooms.addNew}
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
                  Showroom Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advaith Hyundai Koramangala or Swaraj Tractors Mandya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dealership Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      dealershipType === 'automobile'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dealershipType"
                      value="automobile"
                      checked={dealershipType === 'automobile'}
                      onChange={() => setDealershipType('automobile')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <Store className="w-4 h-4" />
                    <span>Farm Equipment Showroom</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      dealershipType === 'tractor'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dealershipType"
                      value="tractor"
                      checked={dealershipType === 'tractor'}
                      onChange={() => setDealershipType('tractor')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <Tractor className="w-4 h-4" />
                    <span>Tractor Dealership</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="rto.desk@dealership.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Showroom location in Karnataka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Internal notes or billing coordinator contacts"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
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
