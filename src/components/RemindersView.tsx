import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  BellRing,
  Plus,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  X,
  Tractor,
  User,
  ShieldAlert,
  Edit2,
  Trash2,
} from 'lucide-react';
import { getExpiryStatus } from '../utils/validators.ts';

export const RemindersView: React.FC = () => {
  const { t, showToast } = useApp();
  const [reminders, setReminders] = useState<any[]>([]);
  const [tractors, setTractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [reminderType, setReminderType] = useState('insurance_expiry');
  const [targetDate, setTargetDate] = useState('');
  const [daysBeforeInterval, setDaysBeforeInterval] = useState('30');
  const [severity, setSeverity] = useState('medium');
  const [vehicleId, setVehicleId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const [rRes, vRes] = await Promise.all([
        fetch('/api/reminders'),
        fetch('/api/vehicles'),
      ]);

      if (rRes.ok) setReminders(await rRes.json());
      if (vRes.ok) setTractors(await vRes.json());
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const openCreateModal = () => {
    setEditingReminder(null);
    setTitle('');
    setReminderType('insurance_expiry');
    setTargetDate('');
    setDaysBeforeInterval('30');
    setSeverity('medium');
    setVehicleId(tractors.length > 0 ? tractors[0].id.toString() : '');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (r: any) => {
    setEditingReminder(r);
    setTitle(r.title);
    setReminderType(r.reminderType);
    setTargetDate(r.targetDate ? r.targetDate.split('T')[0] : '');
    setDaysBeforeInterval(r.daysBeforeInterval?.toString() || '30');
    setSeverity(r.severity || 'medium');
    setVehicleId(r.vehicleId ? r.vehicleId.toString() : '');
    setNotes(r.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) {
      showToast('Title and target date are required', 'error');
      return;
    }

    const selectedTractor = tractors.find((t) => t.id === parseInt(vehicleId, 10));

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        reminderType,
        targetDate,
        daysBeforeInterval: parseInt(daysBeforeInterval, 10),
        severity,
        vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
        clientId: selectedTractor?.clientId || editingReminder?.clientId || null,
        notes: notes.trim(),
      };

      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders';
      const method = editingReminder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save reminder');
      showToast(editingReminder ? 'Reminder updated' : 'Reminder alert configured', 'success');
      setShowModal(false);
      setEditingReminder(null);
      fetchReminders();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this reminder permanently?')) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete reminder');
      showToast('Reminder deleted', 'info');
      fetchReminders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      const res = await fetch(`/api/reminders/${id}/dismiss`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to dismiss reminder');
      showToast('Reminder dismissed', 'info');
      fetchReminders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-600" />
            {t.reminders.title}
          </h2>
          <p className="text-xs text-slate-500">
            Automated alerts for Insurance, Temporary Registrations, Pending Signatures & RTO Due Dates
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t.reminders.addNew}
        </button>
      </div>

      {/* Reminders List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : reminders.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reminders.map((r) => {
              const expStatus = getExpiryStatus(r.targetDate);
              return (
                <div
                  key={r.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    r.isDismissed ? 'opacity-50 bg-slate-50/50 dark:bg-slate-800/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`p-2 rounded-xl mt-0.5 ${
                        r.severity === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : r.severity === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {r.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {r.reminderType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.vehicleReg && `Tractor: ${r.vehicleReg} • `}
                        {r.clientName && `Farmer: ${r.clientName} • `}
                        Target: <strong>{r.targetDate}</strong> ({expStatus.label})
                      </p>
                      {r.notes && <p className="text-[11px] text-slate-400 mt-0.5">{r.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        expStatus.status === 'expired'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : expStatus.status === 'critical'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {expStatus.label}
                    </span>

                    {!r.isDismissed && (
                      <button
                        onClick={() => handleDismiss(r.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
                        title="Dismiss alert"
                      >
                        {t.reminders.dismiss}
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                      title="Edit Reminder"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <BellRing className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No active reminders.</p>
            <p className="text-xs text-slate-500 mt-1">
              Add reminders for upcoming insurance expiries, pending signoffs, or RTO due dates.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingReminder ? <Edit2 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-amber-600" />}
                {editingReminder ? 'Edit Reminder Alert' : t.reminders.addNew}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Renew Mahindra 575 DI Tractor Insurance KA-06-TR-4421"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reminder Type
                  </label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="insurance_expiry">Insurance Expiry</option>
                    <option value="temp_reg_expiry">Temporary Reg Expiry</option>
                    <option value="pending_work">Pending RTO Work</option>
                    <option value="missing_docs">Missing Documents</option>
                    <option value="pending_signatures">Pending Signatures</option>
                    <option value="due_date">Due Date</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry / Target Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alert Interval (Days Before)
                  </label>
                  <select
                    value={daysBeforeInterval}
                    onChange={(e) => setDaysBeforeInterval(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="30">30 Days Before</option>
                    <option value="15">15 Days Before</option>
                    <option value="7">7 Days Before</option>
                    <option value="1">1 Day Before</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority / Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Tractor / Agricultural Machinery
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
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional reminder notes..."
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
                  {editingReminder ? 'Save Changes' : 'Set Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
