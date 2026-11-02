import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Tractor,
  Plus,
  Search,
  Filter,
  FileText,
  QrCode,
  Eye,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Calendar,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building2,
  User,
  Zap,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { downloadDocumentsAsZip } from '../utils/zipDownloader.ts';
import { DocumentViewerModal } from './DocumentViewerModal.tsx';

interface VehicleRecord {
  id: number;
  vehicleId: string;
  registrationNumber: string;
  vehicleType: string;
  category: 'new' | 'used';
  manufacturer: string;
  model: string;
  manufacturingYear: number;
  chassisNumber: string;
  engineNumber: string;
  fuelType: string;
  ownerName: string;
  ownerMobile: string;
  clientId: number | null;
  showroomId: number | null;
  clientName?: string;
  showroomName?: string;
  horsePower?: string;
  vehicleClass?: string;
  isTractor?: boolean;
  qrCode?: string;
  notes?: string;
  insurancePolicyNo?: string;
  insuranceExpiryDate?: string;
  tempRegNumber?: string;
  tempRegExpiryDate?: string;
  createdAt?: string;
}

interface ClientOption {
  id: number;
  clientId: string;
  fullName: string;
  mobileNumber: string;
}

interface ShowroomOption {
  id: number;
  showroomId: string;
  name: string;
  dealershipType?: string;
}

interface DocumentItem {
  id: number;
  docId: string;
  title: string;
  docType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export const TractorsView: React.FC = () => {
  const { t, lang, showToast } = useApp();
  const [tractors, setTractors] = useState<VehicleRecord[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [showrooms, setShowrooms] = useState<ShowroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'new' | 'used' | 'agricultural' | 'commercial'>('all');
  const [selectedShowroomId, setSelectedShowroomId] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTractor, setEditingTractor] = useState<VehicleRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [selectedTractor, setSelectedTractor] = useState<VehicleRecord | null>(null);
  const [tractorDocs, setTractorDocs] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Form states
  const [isUnregistered, setIsUnregistered] = useState(true);
  const [regNumber, setRegNumber] = useState('');
  const [category, setCategory] = useState<'new' | 'used'>('new');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState<number>(new Date().getFullYear());
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [horsePower, setHorsePower] = useState('45');
  const [vehicleClass, setVehicleClass] = useState('agricultural');
  const [fuelType, setFuelType] = useState('diesel');
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [showroomId, setShowroomId] = useState<string>('');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [tempRegNumber, setTempRegNumber] = useState('');
  const [tempRegExpiryDate, setTempRegExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Document Upload Form
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('rc');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [tractorSelectedDocIds, setTractorSelectedDocIds] = useState<number[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const fetchTractors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles?isTractor=true');
      if (res.ok) {
        const data = await res.json();
        setTractors(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load tractor records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/showrooms'),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (sRes.ok) setShowrooms(await sRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTractors();
    fetchAuxData();
  }, []);

  const fetchTractorDetails = async (id: number) => {
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/vehicles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTractor(data);
        const docs = data.documents || [];
        setTractorDocs(docs);
        setTractorSelectedDocIds(docs.map((d: any) => d.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const toggleTractorDocSelection = (docId: number) => {
    setTractorSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const toggleSelectAllTractorDocs = () => {
    if (tractorSelectedDocIds.length === tractorDocs.length) {
      setTractorSelectedDocIds([]);
    } else {
      setTractorSelectedDocIds(tractorDocs.map((d: any) => d.id));
    }
  };

  const handleDownloadTractorZip = async () => {
    if (!selectedTractor || tractorDocs.length === 0) {
      showToast('No documents available in this tractor vault', 'error');
      return;
    }

    const docIds = tractorSelectedDocIds.length > 0
      ? tractorSelectedDocIds
      : tractorDocs.map((d: any) => d.id);

    setDownloadingZip(true);
    try {
      const result = await downloadDocumentsAsZip({
        docIds,
        entityType: 'tractor',
        entityId: selectedTractor.registrationNumber || selectedTractor.vehicleId,
        entityName: `${selectedTractor.manufacturer} ${selectedTractor.model} (${selectedTractor.horsePower || 'Tractor'})`,
      });
      showToast(`Downloaded tractor dossier with ${result.count} documents!`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleOpenDetails = (tractor: VehicleRecord) => {
    setSelectedTractor(tractor);
    setShowDetailsModal(true);
    fetchTractorDetails(tractor.id);
  };

  const handleOpenQR = (tractor: VehicleRecord) => {
    setSelectedTractor(tractor);
    setShowQRModal(true);
  };

  const handleOpenUploadDoc = (tractor: VehicleRecord) => {
    setSelectedTractor(tractor);
    setDocTitle('');
    setDocType('rc');
    setDocFile(null);
    setShowDocUploadModal(true);
  };

  const resetForm = () => {
    setEditingTractor(null);
    setIsUnregistered(true);
    setRegNumber('');
    setCategory('new');
    setManufacturer('');
    setModel('');
    setManufacturingYear(new Date().getFullYear());
    setChassisNumber('');
    setEngineNumber('');
    setHorsePower('45');
    setVehicleClass('agricultural');
    setFuelType('diesel');
    setOwnerName('');
    setOwnerMobile('');
    setClientId('');
    setShowroomId('');
    setInsurancePolicyNo('');
    setInsuranceExpiryDate('');
    setTempRegNumber('');
    setTempRegExpiryDate('');
    setNotes('');
  };

  const openEditTractor = (tr: VehicleRecord) => {
    setEditingTractor(tr);
    setIsUnregistered(!tr.registrationNumber);
    setRegNumber(tr.registrationNumber || '');
    setCategory(tr.category);
    setManufacturer(tr.manufacturer);
    setModel(tr.model);
    setManufacturingYear(tr.manufacturingYear);
    setChassisNumber(tr.chassisNumber);
    setEngineNumber(tr.engineNumber);
    setHorsePower((tr.horsePower || '45').replace(/[^0-9]/g, '') || '45');
    setVehicleClass(tr.vehicleClass || 'agricultural');
    setFuelType(tr.fuelType || 'diesel');
    setOwnerName(tr.ownerName || '');
    setOwnerMobile(tr.ownerMobile || '');
    setClientId(tr.clientId ? tr.clientId.toString() : '');
    setShowroomId(tr.showroomId ? tr.showroomId.toString() : '');
    setInsurancePolicyNo(tr.insurancePolicyNo || '');
    setInsuranceExpiryDate(tr.insuranceExpiryDate || '');
    setTempRegNumber(tr.tempRegNumber || '');
    setTempRegExpiryDate(tr.tempRegExpiryDate || '');
    setNotes(tr.notes || '');
    setShowAddModal(true);
  };

  const handleDeleteTractor = async (tr: VehicleRecord) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete tractor ${tr.vehicleId} (${tr.manufacturer} ${tr.model})? Associated documents and case entries will also be removed.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/vehicles/${tr.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tractor record');
      showToast(`Tractor ${tr.vehicleId} deleted successfully`, 'success');
      fetchTractors();
      if (selectedTractor?.id === tr.id) {
        setShowDetailsModal(false);
        setSelectedTractor(null);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteVaultDoc = async (docId: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      showToast('Document deleted successfully', 'success');
      if (selectedTractor) {
        fetchTractorDetails(selectedTractor.id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddTractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturer.trim() || !model.trim() || !chassisNumber.trim() || !engineNumber.trim() || !ownerName.trim()) {
      showToast('Please fill all mandatory tractor details', 'error');
      return;
    }

    if (!isUnregistered && !regNumber.trim()) {
      showToast('Please enter registration number or select Unregistered', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vehicleType: 'tractor',
        isTractor: true,
        category,
        registrationNumber: isUnregistered ? '' : regNumber.trim().toUpperCase(),
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        manufacturingYear,
        chassisNumber: chassisNumber.trim().toUpperCase(),
        engineNumber: engineNumber.trim().toUpperCase(),
        horsePower: `${horsePower} HP`,
        vehicleClass,
        fuelType,
        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile.trim(),
        clientId: clientId ? parseInt(clientId, 10) : null,
        showroomId: showroomId ? parseInt(showroomId, 10) : null,
        insurancePolicyNo: insurancePolicyNo.trim(),
        insuranceExpiryDate,
        tempRegNumber: isUnregistered ? tempRegNumber.trim() : '',
        tempRegExpiryDate: isUnregistered ? tempRegExpiryDate : '',
        notes: notes.trim(),
      };

      const url = editingTractor ? `/api/vehicles/${editingTractor.id}` : '/api/vehicles';
      const method = editingTractor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingTractor
            ? `Tractor record ${editingTractor.vehicleId} updated successfully`
            : 'Tractor record created successfully',
          'success'
        );
        setShowAddModal(false);
        resetForm();
        fetchTractors();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save tractor record', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving tractor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTractor || !docFile) {
      showToast('Please select a document file to upload', 'error');
      return;
    }

    try {
      setUploadingDoc(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const payload = {
          vehicleId: selectedTractor.id,
          clientId: selectedTractor.clientId,
          title: docTitle.trim() || `${docType.toUpperCase()} - ${selectedTractor.manufacturer} ${selectedTractor.model}`,
          docType,
          fileName: docFile.name,
          fileType: docFile.type,
          fileSize: docFile.size,
          fileDataBase64: base64Data,
        };

        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast('Tractor document uploaded securely', 'success');
          setShowDocUploadModal(false);
          fetchTractorDetails(selectedTractor.id);
        } else {
          showToast('Failed to upload tractor document', 'error');
        }
        setUploadingDoc(false);
      };
      reader.readAsDataURL(docFile);
    } catch (err) {
      console.error(err);
      showToast('Error uploading file', 'error');
      setUploadingDoc(false);
    }
  };

  // Filtered Tractors
  const filteredTractors = tractors.filter((tr) => {
    // Showroom filter
    if (selectedShowroomId !== 'all' && tr.showroomId !== parseInt(selectedShowroomId, 10)) {
      return false;
    }

    // Tab filter
    if (activeTabFilter === 'new' && tr.category !== 'new') return false;
    if (activeTabFilter === 'used' && tr.category !== 'used') return false;
    if (activeTabFilter === 'agricultural' && tr.vehicleClass !== 'agricultural') return false;
    if (activeTabFilter === 'commercial' && tr.vehicleClass !== 'commercial') return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        tr.vehicleId.toLowerCase().includes(q) ||
        (tr.registrationNumber && tr.registrationNumber.toLowerCase().includes(q)) ||
        tr.manufacturer.toLowerCase().includes(q) ||
        tr.model.toLowerCase().includes(q) ||
        tr.chassisNumber.toLowerCase().includes(q) ||
        tr.engineNumber.toLowerCase().includes(q) ||
        tr.ownerName.toLowerCase().includes(q) ||
        tr.ownerMobile.toLowerCase().includes(q) ||
        (tr.clientName && tr.clientName.toLowerCase().includes(q)) ||
        (tr.showroomName && tr.showroomName.toLowerCase().includes(q)) ||
        (tr.horsePower && tr.horsePower.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const tractorMakes = [
    'Mahindra',
    'John Deere',
    'Swaraj',
    'Sonalika',
    'New Holland',
    'Eicher',
    'Massey Ferguson',
    'Kubota',
    'Farmtrac',
    'Powertrac',
    'Standard',
    'VST Shakti',
    'Captain',
  ];

  const popularHP = ['30', '35', '39', '42', '45', '50', '55', '60', '75'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Tractor className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t.tractors?.title || 'Tractor Document Management'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.tractors?.subtitle || 'Agricultural & commercial tractor paperwork, farmer RTC exemption, showroom registration & exchanges'}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {t.tractors?.addNew || 'Add Tractor Record'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Tractor Reg, Chassis VIN, Engine No, HP, Farmer name, Showroom..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedShowroomId}
              onChange={(e) => setSelectedShowroomId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Showrooms & Dealers</option>
              {showrooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.dealershipType === 'tractor' ? '(Tractor Dealer)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTabFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {t.tractors?.allTractors || 'All Tractors'} ({tractors.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('new')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTabFilter === 'new'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {t.tractors?.newTractors || 'New Tractors'} ({tractors.filter((t) => t.category === 'new').length})
          </button>
          <button
            onClick={() => setActiveTabFilter('used')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTabFilter === 'used'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {t.tractors?.usedTractors || 'Used Tractors'} ({tractors.filter((t) => t.category === 'used').length})
          </button>
          <button
            onClick={() => setActiveTabFilter('agricultural')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTabFilter === 'agricultural'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🌱 {t.tractors?.agriClass || 'Agricultural (RTC Exemption)'} (
            {tractors.filter((t) => t.vehicleClass === 'agricultural').length})
          </button>
          <button
            onClick={() => setActiveTabFilter('commercial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTabFilter === 'commercial'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🚛 {t.tractors?.commClass || 'Commercial / Haulage'} (
            {tractors.filter((t) => t.vehicleClass === 'commercial').length})
          </button>
        </div>
      </div>

      {/* Tractor Records Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
          <p>{t.common.loading}</p>
        </div>
      ) : filteredTractors.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <Tractor className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t.common.noRecords}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            No tractor paperwork records match the selected filters. Add a new agricultural or commercial tractor record to begin tracking documents.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            {t.tractors?.addNew || 'Add Tractor Record'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTractors.map((tractor) => {
            const isAgri = tractor.vehicleClass === 'agricultural';
            return (
              <div
                key={tractor.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          {tractor.vehicleId}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            tractor.category === 'new'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {tractor.category === 'new' ? 'New Tractor' : 'Used Tractor'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            isAgri
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                              : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {isAgri ? '🌱 Agricultural' : '🚛 Commercial'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {tractor.manufacturer} {tractor.model}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleOpenQR(tractor)}
                      title="Inspect Tractor QR Code"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Reg No / Unregistered */}
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg mb-3 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {tractor.registrationNumber ? 'Reg Number' : 'Status'}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {tractor.registrationNumber || 'UNREGISTERED (New Delivery)'}
                    </span>
                  </div>

                  {/* Specs & Owner */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Power Rating:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        {tractor.horsePower || '45 HP'} ({tractor.manufacturingYear})
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Chassis (VIN):</span>
                      <span className="font-mono">{tractor.chassisNumber}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Engine No:</span>
                      <span className="font-mono">{tractor.engineNumber}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Farmer / Owner:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {tractor.ownerName} {tractor.ownerMobile ? `(${tractor.ownerMobile})` : ''}
                      </span>
                    </div>

                    {tractor.showroomName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dealer/Showroom:</span>
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {tractor.showroomName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleOpenDetails(tractor)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors"
                    title="View tractor document vault and details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Vault
                  </button>

                  <button
                    onClick={() => handleOpenUploadDoc(tractor)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    title="Upload document for this tractor"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>

                  <button
                    onClick={() => openEditTractor(tractor)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                    title="Edit tractor and farmer/owner details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteTractor(tractor)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete tractor record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT TRACTOR RECORD */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                  <Tractor className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingTractor
                      ? `Edit Tractor Record (${editingTractor.vehicleId})`
                      : (t.tractors?.addNew || 'Add New Tractor Record')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingTractor
                      ? 'Update specifications, farmer/owner paperwork, and showroom assignment'
                      : 'Auto-generates KA-TRAC-XXXX Tractor ID with farmer/owner details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTractor} className="mt-4 space-y-4">
              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tractor Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'new' | 'used')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="new">New Tractor (Showroom Delivery)</option>
                    <option value="used">Used / Old Tractor (Exchange / Resale)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={vehicleClass}
                    onChange={(e) => setVehicleClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="agricultural">Agricultural Tractor (Farmer RTC / Tax Exemption)</option>
                    <option value="commercial">Commercial / Haulage Tractor</option>
                    <option value="trailer_attached">Tractor with Trailer Attached</option>
                  </select>
                </div>
              </div>

              {/* Registration Number or Unregistered */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Registration Number
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={isUnregistered}
                      onChange={(e) => setIsUnregistered(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    New Unregistered Tractor (No Reg No yet)
                  </label>
                </div>

                {!isUnregistered ? (
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. KA-06-TR-4567"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono uppercase"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Temporary Reg No (TR) (Optional)</label>
                      <input
                        type="text"
                        value={tempRegNumber}
                        onChange={(e) => setTempRegNumber(e.target.value)}
                        placeholder="e.g. KA-TR-2026-908"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">TR Expiry Date</label>
                      <input
                        type="date"
                        value={tempRegExpiryDate}
                        onChange={(e) => setTempRegExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Make, Model, Year, HP */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="tractor-makes"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. Mahindra"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                  <datalist id="tractor-makes">
                    {tractorMakes.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. 575 DI Sarpanch"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Horsepower (HP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="tractor-hp-list"
                    value={horsePower}
                    onChange={(e) => setHorsePower(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-emerald-600"
                  />
                  <datalist id="tractor-hp-list">
                    {popularHP.map((hp) => (
                      <option key={hp} value={hp} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mfg Year
                  </label>
                  <input
                    type="number"
                    value={manufacturingYear}
                    onChange={(e) => setManufacturingYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Chassis & Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Chassis Number (VIN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    placeholder="e.g. MA1TRAC56789012"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Engine Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value)}
                    placeholder="e.g. ENG-DI-987654"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono uppercase"
                  />
                </div>
              </div>

              {/* Owner and Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Farmer / Owner Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Basavaraj Patel"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Owner Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={ownerMobile}
                    onChange={(e) => setOwnerMobile(e.target.value)}
                    placeholder="e.g. 9845012345"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Link Showroom & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Linked Tractor Showroom / Dealership
                  </label>
                  <select
                    value={showroomId}
                    onChange={(e) => setShowroomId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">None / Direct Farmer Direct</option>
                    {showrooms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.dealershipType === 'tractor' ? '(Tractor Dealership)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Linked Client Profile
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">None / Create Profile Later</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.clientId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Insurance Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Policy No (Optional)
                  </label>
                  <input
                    type="text"
                    value={insurancePolicyNo}
                    onChange={(e) => setInsurancePolicyNo(e.target.value)}
                    placeholder="e.g. NIC-AGRI-987654"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiryDate}
                    onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  RTO / Paperwork Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Farmer Pahani/RTC submitted for road tax exemption under section 7 of KMVT Act; hypothecation with Canara Bank Gramin branch"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTractor ? 'Update Tractor Record' : 'Save Tractor Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRACTOR DETAILS & DOCUMENT VAULT */}
      {showDetailsModal && selectedTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    {selectedTractor.vehicleId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                    {selectedTractor.category === 'new' ? 'New Tractor' : 'Used Tractor'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {selectedTractor.manufacturer} {selectedTractor.model}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specifications Card */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block">Registration</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedTractor.registrationNumber || 'UNREGISTERED'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Horsepower (HP)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedTractor.horsePower || '45 HP'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle Class</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {selectedTractor.vehicleClass || 'Agricultural'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Mfg Year</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedTractor.manufacturingYear}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Chassis (VIN)</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedTractor.chassisNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Engine No</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedTractor.engineNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Owner / Farmer</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedTractor.ownerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedTractor.ownerMobile || 'N/A'}
                </span>
              </div>
            </div>

            {/* Document Vault Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tractor Paperwork & Documents ({tractorDocs.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleOpenUploadDoc(selectedTractor);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Add Document
                </button>
              </div>

              {/* Action Toolbar for Multi-select ZIP */}
              {tractorDocs.length > 0 && (
                <div className="flex items-center justify-between gap-2 p-2.5 mb-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={toggleSelectAllTractorDocs}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  >
                    {tractorSelectedDocIds.length === tractorDocs.length && tractorDocs.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>
                      {tractorSelectedDocIds.length === tractorDocs.length ? 'Deselect All' : 'Select All'} ({tractorSelectedDocIds.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTractorZip}
                    disabled={downloadingZip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    title="Download selected tractor paperwork as single offline ZIP bundle"
                  >
                    {downloadingZip ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Download Dossier ({tractorSelectedDocIds.length > 0 ? tractorSelectedDocIds.length : tractorDocs.length} ZIP)
                    </span>
                  </button>
                </div>
              )}

              {loadingDocs ? (
                <div className="py-8 text-center text-slate-400">
                  <Clock className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs">Loading vault...</p>
                </div>
              ) : tractorDocs.length === 0 ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500">
                    No documents uploaded yet for this tractor. Upload Form 20/21/22, RC, Insurance, or Farmer RTC Exemption.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tractorDocs.map((doc) => {
                    const isSelected = tractorSelectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleTractorDocSelection(doc.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            className="w-4 h-4 text-purple-600 rounded-sm border-slate-300 focus:ring-purple-500"
                          />
                          <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {doc.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="uppercase px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-700 dark:text-slate-300">
                                {doc.docType}
                              </span>
                              <span>{doc.fileName}</span>
                              <span>({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(doc);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100"
                            title="View uploaded document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <a
                            href={`/api/documents/${doc.id}/download`}
                            download={doc.fileName}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Download document file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                handleDeleteVaultDoc(doc.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRACTOR QR CODE */}
      {showQRModal && selectedTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Tractor Verification QR
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-inner inline-block my-2">
              {selectedTractor.qrCode ? (
                <img
                  src={selectedTractor.qrCode}
                  alt="Tractor QR"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                {selectedTractor.vehicleId}
              </p>
              <p>
                {selectedTractor.manufacturer} {selectedTractor.model} ({selectedTractor.horsePower || '45 HP'})
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                VIN: {selectedTractor.chassisNumber}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <a
                href={selectedTractor.qrCode}
                download={`${selectedTractor.vehicleId}-QR.png`}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Download QR Image
              </a>
              <button
                onClick={() => setShowQRModal(false)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD TRACTOR DOCUMENT */}
      {showDocUploadModal && selectedTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Upload Tractor Document
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  For {selectedTractor.manufacturer} {selectedTractor.model} ({selectedTractor.vehicleId})
                </p>
              </div>
              <button
                onClick={() => setShowDocUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="rc">Registration Certificate (RC)</option>
                  <option value="insurance">Insurance Policy</option>
                  <option value="temporary_reg">Temporary Registration (TR)</option>
                  <option value="form_20">Form 20 (Registration Application)</option>
                  <option value="form_21">Form 21 (Sale Certificate)</option>
                  <option value="form_22">Form 22 (Initial Roadworthiness)</option>
                  <option value="form_35">Form 35 (Hypothecation / Bank Loan)</option>
                  <option value="noc">No Objection Certificate (NOC)</option>
                  <option value="road_tax_receipt">Road Tax & Registration Receipt</option>
                  <option value="agri_rtc_exemption">Agricultural Tax Exemption (Pahani / RTC Record)</option>
                  <option value="ownership_transfer">Ownership Transfer Paperwork</option>
                  <option value="other">Other Tractor RTO Paperwork</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Label / Title (Optional)
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Canara Bank Form 35 or Mandya RTC Record"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select File (PDF, JPG, PNG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDocFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDocUploadModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc || !docFile}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT VIEWER */}
      {previewDoc && (
        <DocumentViewerModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDelete={handleDeleteVaultDoc}
        />
      )}
    </div>
  );
};
