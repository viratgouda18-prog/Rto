import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ScanText,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  RefreshCw,
  Car,
  ShieldCheck,
  Edit3,
  Save,
  Info,
} from 'lucide-react';
import { formatKarnatakaRegNumber } from '../utils/validators.ts';

export const OCRScannerView: React.FC = () => {
  const { t, showToast, setActiveTab } = useApp();
  const [fileData, setFileData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [docType, setDocType] = useState<string>('rc');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  // Review & Correction fields
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [vehicleManufacturer, setVehicleManufacturer] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [fuelType, setFuelType] = useState('petrol');
  const [confidenceNotes, setConfidenceNotes] = useState('');

  // Verified toggle
  const [userConfirmedVerified, setUserConfirmedVerified] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setScanResult(null);
    setUserConfirmedVerified(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOCR = async () => {
    if (!fileData) {
      showToast('Please upload an image or PDF first', 'error');
      return;
    }

    setScanning(true);
    setScanResult(null);
    setUserConfirmedVerified(false);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, docType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR Extraction failed');

      setScanResult(data);
      const ext = data.extractedData || {};

      // Populate review fields
      setRegistrationNumber(formatKarnatakaRegNumber(ext.registrationNumber || ''));
      setChassisNumber((ext.chassisNumber || '').toUpperCase());
      setEngineNumber((ext.engineNumber || '').toUpperCase());
      setOwnerName(ext.ownerName || '');
      setInsurancePolicyNo(ext.insurancePolicyNo || '');
      setInsuranceExpiryDate(ext.insuranceExpiryDate || '');
      setVehicleManufacturer(ext.vehicleManufacturer || 'Honda');
      setVehicleModel(ext.vehicleModel || 'Activa');
      setFuelType((ext.fuelType || 'petrol').toLowerCase());
      setConfidenceNotes(ext.confidenceNotes || 'Extraction complete. Please inspect every field.');

      showToast('OCR extracted fields successfully. Please review before saving.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveVerifiedVehicle = async () => {
    if (!userConfirmedVerified) {
      showToast('Please confirm and check "I have reviewed and verified the extracted fields"', 'error');
      return;
    }
    if (!chassisNumber.trim() || !engineNumber.trim() || !ownerName.trim()) {
      showToast('Chassis number, engine number, and owner name are required', 'error');
      return;
    }

    setSavingRecord(true);
    try {
      // 1. Create verified vehicle
      const vRes = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber,
          category: registrationNumber ? 'used' : 'new',
          vehicleType: '4_wheeler',
          manufacturer: vehicleManufacturer.trim(),
          model: vehicleModel.trim(),
          manufacturingYear: new Date().getFullYear(),
          chassisNumber,
          engineNumber,
          fuelType,
          ownerName,
          ownerMobile: '9876543210',
          insurancePolicyNo,
          insuranceExpiryDate,
          notes: `Created via OCR Scan from ${fileName}`,
        }),
      });

      const newVehicle = await vRes.json();
      if (!vRes.ok) throw new Error(newVehicle.error || 'Failed to create vehicle record');

      // 2. Attach scanned document to the vehicle with ocrVerified = true
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${docType.toUpperCase()} - ${registrationNumber || chassisNumber.slice(-6)} (OCR Verified)`,
          docType,
          fileName,
          fileType: 'image/jpeg',
          fileData,
          vehicleId: newVehicle.id,
          ocrExtractedData: {
            registrationNumber,
            chassisNumber,
            engineNumber,
            ownerName,
            insurancePolicyNo,
            insuranceExpiryDate,
          },
          ocrVerified: true,
          uploadedBy: 'AI OCR Scanner (Agent Verified)',
        }),
      });

      showToast('Verified vehicle record and document stored in database!', 'success');
      setActiveTab('vehicles');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingRecord(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ScanText className="w-5 h-5 text-amber-600" />
          {t.docs.ocrAction}
        </h2>
        <p className="text-xs text-slate-500">
          Powered by Gemini 3.8 Flash • Mandatory human-in-the-loop review before verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Document Upload & Live Image Preview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-600" />
              1. Upload Document for OCR
            </h3>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border-0"
            >
              <option value="rc">Registration Certificate (RC)</option>
              <option value="insurance">Insurance Policy</option>
              <option value="form_20">Form 20 Application</option>
              <option value="form_21">Form 21 Sale Certificate</option>
              <option value="showroom_invoice">Showroom Invoice</option>
              <option value="noc">NOC Certificate</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <input
              type="file"
              id="ocrFileInput"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="ocrFileInput" className="cursor-pointer space-y-2 block">
              <ScanText className="w-10 h-10 mx-auto text-amber-500 opacity-80" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to browse or drop document photo (RC / Insurance / Form)
              </p>
              <p className="text-[11px] text-slate-400">JPG, JPEG, or PNG supported</p>
            </label>
          </div>

          {fileName && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between text-xs">
              <span className="font-mono text-amber-800 dark:text-amber-300 truncate font-semibold">
                {fileName}
              </span>
              <button
                onClick={handleRunOCR}
                disabled={scanning}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5 shadow-xs shrink-0"
              >
                {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
                Run AI OCR
              </button>
            </div>
          )}

          {fileData && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[360px] flex items-center justify-center bg-slate-950">
              <img src={fileData} alt="Document Scan" className="max-h-[360px] object-contain" />
            </div>
          )}
        </div>

        {/* Right Column: Review & Verification Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              2. Review & Confirm Extracted Data
            </h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              Human Review Required
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Per Indian RTO regulatory compliance, AI OCR extractions are treated as provisional.
              Inspect and edit every field before marking as verified.
            </p>
          </div>

          {/* Extracted Fields Form */}
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA-01-AB-1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Owner Name
                </label>
                <input
                  type="text"
                  placeholder="Owner Name as printed"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chassis Number (VIN)
                </label>
                <input
                  type="text"
                  placeholder="Chassis Number"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Engine Number
                </label>
                <input
                  type="text"
                  placeholder="Engine Number"
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Insurance Policy Number
                </label>
                <input
                  type="text"
                  placeholder="Policy No"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={vehicleManufacturer}
                  onChange={(e) => setVehicleManufacturer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
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

            {confidenceNotes && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500">
                <strong>AI OCR Notes:</strong> {confidenceNotes}
              </div>
            )}

            {/* Verification Checkbox */}
            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={userConfirmedVerified}
                  onChange={(e) => setUserConfirmedVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>I have reviewed, corrected, and confirm these extracted details are accurate</span>
              </label>
            </div>

            <button
              onClick={handleSaveVerifiedVehicle}
              disabled={!userConfirmedVerified || savingRecord}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {savingRecord ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Verified Vehicle & Attach Scanned Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
