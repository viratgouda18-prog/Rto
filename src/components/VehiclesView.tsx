import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Car,
  Tractor,
  Plus,
  QrCode,
  FileText,
  Phone,
  ShieldAlert,
  Edit2,
  Archive,
  Eye,
  RefreshCw,
  X,
  Upload,
  AlertCircle,
  Building,
  User,
  Calendar,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import { getExpiryStatus, formatKarnatakaRegNumber } from '../utils/validators.ts';
import { downloadDocumentsAsZip } from '../utils/zipDownloader.ts';

export const VehiclesView: React.FC = () => {
  const { t, showToast, searchQuery, setActiveTab, selectedEntityForView, setSelectedEntityForView } = useApp();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'new' | 'used'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [viewingVehicleDetail, setViewingVehicleDetail] = useState<any | null>(null);
  const [qrModalVehicle, setQrModalVehicle] = useState<any | null>(null);
  const [uploadDocModalVehicle, setUploadDocModalVehicle] = useState<any | null>(null);
  const [vehSelectedDocIds, setVehSelectedDocIds] = useState<number[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Form state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [vehicleType, setVehicleType] = useState('4_wheeler');
  const [category, setCategory] = useState<'new' | 'used'>('new');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState(new Date().getFullYear().toString());
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [fuelType, setFuelType] = useState('petrol');
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [clientId, setClientId] = useState('');
  const [showroomId, setShowroomId] = useState('');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [tempRegNumber, setTempRegNumber] = useState('');
  const [tempRegExpiryDate, setTempRegExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Document upload state for vehicle
  const [docType, setDocType] = useState('rc');
  const [docTitle, setDocTitle] = useState('');
  const [uploadFileData, setUploadFileData] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const [vRes, cRes, sRes] = await Promise.all([
        fetch(`/api/vehicles?category=${categoryFilter}`),
        fetch('/api/clients?status=active'),
        fetch('/api/showrooms'),
      ]);

      if (vRes.ok) setVehicles(await vRes.json());
      if (cRes.ok) setClients(await cRes.json());
      if (sRes.ok) setShowrooms(await sRes.json());

      if (selectedEntityForView && selectedEntityForView.type === 'vehicle') {
        openVehicleDetail(selectedEntityForView.id);
        setSelectedEntityForView(null);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openVehicleDetail = async (id: number | string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`);
      if (!res.ok) throw new Error('Failed to load vehicle details');
      const data = await res.json();
      setViewingVehicleDetail(data);
      if (data.documents && Array.isArray(data.documents)) {
        setVehSelectedDocIds(data.documents.map((d: any) => d.id));
      } else {
        setVehSelectedDocIds([]);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const toggleVehDocSelection = (docId: number) => {
    setVehSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleSelectAllVehDocs = () => {
    if (!viewingVehicleDetail?.documents) return;
    if (vehSelectedDocIds.length === viewingVehicleDetail.documents.length) {
      setVehSelectedDocIds([]);
    } else {
      setVehSelectedDocIds(viewingVehicleDetail.documents.map((d: any) => d.id));
    }
  };

  const handleDownloadVehZip = async () => {
    if (!viewingVehicleDetail || !viewingVehicleDetail.documents || viewingVehicleDetail.documents.length === 0) {
      showToast('No documents available in this vehicle vault', 'error');
      return;
    }

    const docIds = vehSelectedDocIds.length > 0
      ? vehSelectedDocIds
      : viewingVehicleDetail.documents.map((d: any) => d.id);

    setDownloadingZip(true);
    try {
      const result = await downloadDocumentsAsZip({
        docIds,
        entityType: viewingVehicleDetail.isTractor ? 'tractor' : 'vehicle',
        entityId: viewingVehicleDetail.registrationNumber || viewingVehicleDetail.vehicleId,
        entityName: `${viewingVehicleDetail.manufacturer} ${viewingVehicleDetail.model}`,
      });
      showToast(`Downloaded vehicle dossier with ${result.count} documents!`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [categoryFilter]);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setRegistrationNumber('');
    setIsUnregistered(false);
    setVehicleType('4_wheeler');
    setCategory('new');
    setManufacturer('');
    setModel('');
    setManufacturingYear(new Date().getFullYear().toString());
    setChassisNumber('');
    setEngineNumber('');
    setFuelType('petrol');
    setOwnerName('');
    setOwnerMobile('');
    setClientId('');
    setShowroomId('');
    setInsurancePolicyNo('');
    setInsuranceExpiryDate('');
    setTempRegNumber('');
    setTempRegExpiryDate('');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (v: any) => {
    setEditingVehicle(v);
    setRegistrationNumber(v.registrationNumber || '');
    setIsUnregistered(!v.registrationNumber);
    setVehicleType(v.vehicleType);
    setCategory(v.category);
    setManufacturer(v.manufacturer);
    setModel(v.model);
    setManufacturingYear(v.manufacturingYear.toString());
    setChassisNumber(v.chassisNumber);
    setEngineNumber(v.engineNumber);
    setFuelType(v.fuelType);
    setOwnerName(v.ownerName);
    setOwnerMobile(v.ownerMobile || '');
    setClientId(v.clientId ? v.clientId.toString() : '');
    setShowroomId(v.showroomId ? v.showroomId.toString() : '');
    setInsurancePolicyNo(v.insurancePolicyNo || '');
    setInsuranceExpiryDate(v.insuranceExpiryDate || '');
    setTempRegNumber(v.tempRegNumber || '');
    setTempRegExpiryDate(v.tempRegExpiryDate || '');
    setNotes(v.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Sync owner name and mobile if client is selected
  const handleClientChange = (cId: string) => {
    setClientId(cId);
    if (cId) {
      const selected = clients.find((c) => c.id.toString() === cId);
      if (selected) {
        setOwnerName(selected.fullName);
        setOwnerMobile(selected.mobileNumber);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!manufacturer.trim() || !model.trim()) {
      setFormError('Manufacturer and model are required');
      return;
    }
    if (!chassisNumber.trim() || !engineNumber.trim()) {
      setFormError('Chassis number (VIN) and engine number are required for RTO registration');
      return;
    }
    if (!ownerName.trim()) {
      setFormError('Owner name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        registrationNumber: isUnregistered ? '' : formatKarnatakaRegNumber(registrationNumber),
        vehicleType,
        category,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        manufacturingYear: parseInt(manufacturingYear, 10),
        chassisNumber: chassisNumber.trim().toUpperCase(),
        engineNumber: engineNumber.trim().toUpperCase(),
        fuelType,
        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile.trim(),
        clientId: clientId ? parseInt(clientId, 10) : null,
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        insurancePolicyNo: insurancePolicyNo.trim(),
        insuranceExpiryDate,
        tempRegNumber: tempRegNumber.trim(),
        tempRegExpiryDate,
        notes: notes.trim(),
      };

      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vehicle');

      showToast(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully', 'success');
      setShowModal(false);
      fetchVehicles();
      if (viewingVehicleDetail?.id === (editingVehicle?.id || data.id)) {
        openVehicleDetail(editingVehicle?.id || data.id);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm('Archive this vehicle record?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive vehicle');
      showToast('Vehicle archived', 'info');
      fetchVehicles();
      if (viewingVehicleDetail?.id === id) setViewingVehicleDetail(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Upload document for a specific vehicle
  const handleUploadVehicleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocModalVehicle || !uploadFileData) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle.trim() || `${docType.toUpperCase()} - ${uploadDocModalVehicle.model}`,
          docType,
          fileName: uploadFileName,
          fileType: uploadFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          fileData: uploadFileData,
          vehicleId: uploadDocModalVehicle.id,
          clientId: uploadDocModalVehicle.clientId,
          showroomId: uploadDocModalVehicle.showroomId,
        }),
      });

      if (!res.ok) throw new Error('Failed to upload document');
      showToast('Document securely uploaded to vehicle file vault', 'success');
      setUploadDocModalVehicle(null);
      setUploadFileData('');
      setUploadFileName('');
      setDocTitle('');
      if (viewingVehicleDetail?.id === uploadDocModalVehicle.id) {
        openVehicleDetail(uploadDocModalVehicle.id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.registrationNumber?.toLowerCase().includes(q) ||
      v.vehicleId.toLowerCase().includes(q) ||
      v.chassisNumber.toLowerCase().includes(q) ||
      v.engineNumber.toLowerCase().includes(q) ||
      v.ownerName.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.manufacturer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t.vehicles.title}
          </h2>
          <p className="text-xs text-slate-500">
            Paperwork vaults, QR codes, versioned RTO forms, and unregistered vehicle support
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryFilter('new')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'new'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              New Vehicles
            </button>
            <button
              onClick={() => setCategoryFilter('used')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                categoryFilter === 'used'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Used Vehicles
            </button>
          </div>
          <button
            onClick={() => setActiveTab('tractors')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors"
          >
            <Tractor className="w-4 h-4" />
            Tractor Records
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            {t.vehicles.addNew}
          </button>
        </div>
      </div>

      {/* Vehicle List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Reg No / ID</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Chassis & Engine</th>
                  <th className="py-3 px-4">Owner & Mobile</th>
                  <th className="py-3 px-4">Showroom</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Insurance Expiry</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.map((v) => {
                  const insStatus = getExpiryStatus(v.insuranceExpiryDate);
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white block">
                              {v.registrationNumber || 'UNREGISTERED'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{v.vehicleId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {v.manufacturer} {v.model}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {v.manufacturingYear} • {v.fuelType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div>CH: {v.chassisNumber}</div>
                        <div className="text-slate-400">EN: {v.engineNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 dark:text-white block truncate max-w-[140px]">
                          {v.ownerName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {v.ownerMobile || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                        {v.showroomName || 'Direct'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            v.category === 'new'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {v.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {v.insuranceExpiryDate ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              insStatus.status === 'expired'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : insStatus.status === 'critical'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {v.insuranceExpiryDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setQrModalVehicle(v)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                            title="View Secure QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUploadDocModalVehicle(v)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                            title="Upload RTO Document"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openVehicleDetail(v.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                            title="View vehicle vault"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Edit vehicle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {v.status === 'active' && (
                            <button
                              onClick={() => handleArchive(v.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              title="Archive vehicle"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-500" />
            <p className="text-sm font-semibold">No vehicles found in this category.</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "Add Vehicle" to register new or used vehicle paperwork.
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono font-bold text-purple-600">
                {qrModalVehicle.vehicleId}
              </span>
              <button
                onClick={() => setQrModalVehicle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {qrModalVehicle.registrationNumber || 'Unregistered Vehicle'}
              </h3>
              <p className="text-xs text-slate-500">
                {qrModalVehicle.manufacturer} {qrModalVehicle.model}
              </p>
            </div>

            {/* Rendered QR Code image */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-xs">
              <img
                src={qrModalVehicle.qrCode}
                alt="Vehicle QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-[11px] text-slate-400 px-4">
              Scanned by authorized Karnataka RTO staff to securely load vehicle case paperwork
              without exposing sensitive PII.
            </p>

            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = qrModalVehicle.qrCode;
                link.download = `QR_${qrModalVehicle.vehicleId}.png`;
                link.click();
              }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
            >
              Download QR Code Image
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Detail Vault Modal */}
      {viewingVehicleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingVehicleDetail.vehicleId} • {viewingVehicleDetail.category.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {viewingVehicleDetail.registrationNumber || 'UNREGISTERED NEW VEHICLE'}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingVehicleDetail.manufacturer} {viewingVehicleDetail.model} (
                  {viewingVehicleDetail.manufacturingYear})
                </p>
              </div>
              <button
                onClick={() => setViewingVehicleDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle Technical Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <div>
                <span className="text-slate-400 block font-medium">Chassis No (VIN)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.chassisNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Engine No</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.engineNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fuel Type</span>
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.fuelType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Owner</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.ownerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Owner Mobile</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.ownerMobile || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Showroom</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.showroom?.name || 'Direct / Private'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Insurance Policy</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.insurancePolicyNo || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Insurance Expiry</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.insuranceExpiryDate || 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Temp Reg (TR) Expiry</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {viewingVehicleDetail.tempRegExpiryDate || '—'}
                </span>
              </div>
            </div>

            {/* Document Vault with Versions */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Vehicle Documents & Version History ({viewingVehicleDetail.documents?.length || 0})
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {viewingVehicleDetail.documents && viewingVehicleDetail.documents.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={toggleSelectAllVehDocs}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {vehSelectedDocIds.length === viewingVehicleDetail.documents.length && viewingVehicleDetail.documents.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>
                          {vehSelectedDocIds.length === viewingVehicleDetail.documents.length
                            ? t.docs.deselectAll || 'Deselect All'
                            : t.docs.selectAll || 'Select All'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadVehZip}
                        disabled={downloadingZip}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        title="Download selected vehicle documents bundled into a single ZIP file with official manifest"
                      >
                        {downloadingZip ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>
                          Download Dossier ({vehSelectedDocIds.length > 0 ? vehSelectedDocIds.length : viewingVehicleDetail.documents.length} ZIP)
                        </span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setUploadDocModalVehicle(viewingVehicleDetail)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Document
                  </button>
                </div>
              </div>

              {viewingVehicleDetail.documents && viewingVehicleDetail.documents.length > 0 ? (
                <div className="space-y-2">
                  {viewingVehicleDetail.documents.map((doc: any) => {
                    const isSelected = vehSelectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleVehDocSelection(doc.id)}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by row click
                            className="w-4 h-4 text-purple-600 rounded-sm border-slate-300 focus:ring-purple-500"
                          />
                          <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold uppercase text-[10px]">
                            {doc.docType}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {doc.fileName} • v{doc.version} • {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.ocrVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                              OCR Verified
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                  No documents in this vehicle vault. Click "Upload Document" to attach Form 20, RC,
                  Insurance, Form 21, or Showroom Invoice.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewingVehicleDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadDocModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Paperwork: {uploadDocModalVehicle.model}
              </h3>
              <button
                onClick={() => setUploadDocModalVehicle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadVehicleDoc} className="space-y-4 text-xs sm:text-sm">
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
                  <option value="form_20">Form 20 (Application for Registration)</option>
                  <option value="form_21">Form 21 (Sale Certificate)</option>
                  <option value="form_22">Form 22 (Roadworthiness Certificate)</option>
                  <option value="showroom_invoice">Showroom Invoice Copy (Ref)</option>
                  <option value="noc">No Objection Certificate (NOC)</option>
                  <option value="form_35">Form 35 (Hypothecation Termination)</option>
                  <option value="hypothecation">Hypothecation Document (HPA)</option>
                  <option value="other">Other RTO Document</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Comprehensive Insurance Policy 2026-27"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select File (PDF, JPG, PNG) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploadFileName && (
                  <p className="text-xs text-emerald-600 mt-1 font-mono">Selected: {uploadFileName}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadDocModalVehicle(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc || !uploadFileData}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                >
                  {uploadingDoc && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVehicle ? 'Edit Vehicle Details' : t.vehicles.addNew}
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
              {/* Registration & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Registration Number
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnregistered}
                        onChange={(e) => {
                          setIsUnregistered(e.target.checked);
                          if (e.target.checked) setRegistrationNumber('');
                        }}
                        className="rounded text-amber-600"
                      />
                      Unregistered (New)
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={isUnregistered}
                    placeholder="e.g. KA-01-AB-1234"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="new">New Vehicle</option>
                    <option value="used">Used / Old Vehicle</option>
                  </select>
                </div>
              </div>

              {/* Make, Model, Year, Type */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Make <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Honda / Hyundai"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Activa 6G / Creta"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={2030}
                    value={manufacturingYear}
                    onChange={(e) => setManufacturingYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric (EV)</option>
                    <option value="cng">CNG</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Chassis & Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chassis Number (VIN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="17-character VIN"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Engine Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Engine Serial Number"
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Linked Client and Showroom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Registered Client
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Registered Client (Optional) --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.mobileNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Showroom
                  </label>
                  <select
                    value={showroomId}
                    onChange={(e) => setShowroomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Direct / No Showroom --</option>
                    {showrooms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.showroomId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Owner details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Owner Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name as per Aadhaar"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Owner Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={ownerMobile}
                    onChange={(e) => setOwnerMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Insurance & TR details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Policy Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2311/0019283/00"
                    value={insurancePolicyNo}
                    onChange={(e) => setInsurancePolicyNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiryDate}
                    onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
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
