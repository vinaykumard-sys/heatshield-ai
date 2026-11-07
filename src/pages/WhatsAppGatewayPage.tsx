import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle,
  QrCode,
  UserPlus,
  Users,
  Send,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  Megaphone,
  History,
  Phone,
  MapPin,
  X,
  Plus,
  ChevronRight,
  Flame,
  Info,
  Link2,
  Copy,
} from 'lucide-react';
import {
  checkGatewayHealth,
  fetchQRCode,
  fetchContacts,
  addContact,
  removeContact,
  sendWhatsAppMessage,
  broadcastWhatsApp,
  fetchDeliveryLogs,
  disconnectWhatsApp,
  formatHeatAlertMessage,
  formatEmergencyAlertMessage,
  formatDailyBriefingMessage,
  triggerDailyBriefing,
  WAContact,
  WAStatus,
  WADeliveryLog,
  WABroadcastResult,
} from '../lib/whatsappGateway';
import { useAuth } from '../context/AuthContext';

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: WAStatus }> = ({ status }) => {
  const map: Record<WAStatus, { label: string; color: string; icon: React.ReactNode }> = {
    connected:   { label: 'Connected',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Wifi className="w-3 h-3" /> },
    qr_ready:    { label: 'Scan QR',     color: 'bg-blue-50 text-blue-700 border-blue-200',           icon: <QrCode className="w-3 h-3" /> },
    connecting:  { label: 'Connecting',  color: 'bg-amber-50 text-amber-700 border-amber-200',        icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    logged_out:  { label: 'Logged Out',  color: 'bg-slate-50 text-slate-500 border-slate-200',        icon: <WifiOff className="w-3 h-3" /> },
    unreachable: { label: 'Unreachable', color: 'bg-red-50 text-red-700 border-red-200',              icon: <AlertCircle className="w-3 h-3" /> },
  };
  const { label, color, icon } = map[status] || map.unreachable;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {icon} {label}
    </span>
  );
};

// ─── Toast ───────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  return { toast, show };
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const WhatsAppGatewayPage: React.FC = () => {
  const { user } = useAuth();
  const { toast, show: showToast } = useToast();

  const [tab, setTab] = useState<'connect' | 'contacts' | 'broadcast' | 'logs'>('connect');
  const [status, setStatus] = useState<WAStatus>('connecting');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [contacts, setContacts] = useState<WAContact[]>([]);
  const [logs, setLogs] = useState<WADeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<WABroadcastResult[] | null>(null);

  // Add contact form
  const [addForm, setAddForm] = useState({ name: '', phone: '', locality: '', countryCode: '91' });
  const [addError, setAddError] = useState('');

  // Send single message
  const [singleTo, setSingleTo] = useState('');
  const [singleMsg, setSingleMsg] = useState('');

  // Broadcast message
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [broadcastType, setBroadcastType] = useState<'custom' | 'heat_alert' | 'emergency' | 'briefing'>('custom');
  const [isTriggeringBriefing, setIsTriggeringBriefing] = useState(false);

  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Status polling ─────────────────────────────────────────────────────────
  const refreshStatus = useCallback(async () => {
    const { reachable, status: s } = await checkGatewayHealth();
    setStatus(reachable ? s : 'unreachable');
    if (s === 'qr_ready') {
      const { qr } = await fetchQRCode();
      setQrImage(qr);
    } else {
      setQrImage(null);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // ─── Load contacts & logs on tab switch ────────────────────────────────────
  useEffect(() => {
    if (tab === 'contacts' || tab === 'broadcast') {
      fetchContacts().then(setContacts).catch(() => {});
    }
    if (tab === 'logs') {
      fetchDeliveryLogs().then(setLogs).catch(() => {});
    }
  }, [tab]);

  // ─── Contact management ─────────────────────────────────────────────────────
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      setAddError('Name and phone number are required.');
      return;
    }
    setIsLoading(true);
    try {
      const created = await addContact({
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        locality: addForm.locality.trim(),
        countryCode: addForm.countryCode,
      });
      setContacts(prev => [...prev, created]);
      setAddForm({ name: '', phone: '', locality: '', countryCode: '91' });
      showToast(`✅ ${created.name} added to contacts`);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add contact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveContact = async (contact: WAContact) => {
    if (!confirm(`Remove ${contact.name} (${contact.phone})?`)) return;
    try {
      await removeContact(contact.phone);
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      showToast(`Removed ${contact.name}`);
    } catch {
      showToast('Failed to remove contact', 'error');
    }
  };

  // ─── Single send ───────────────────────────────────────────────────────────
  const handleSendSingle = async () => {
    if (!singleTo || !singleMsg) return;
    setIsLoading(true);
    try {
      const r = await sendWhatsAppMessage(singleTo, singleMsg);
      if (r.success) {
        showToast('Message sent ✅');
        setSingleMsg('');
      } else {
        showToast(r.error || 'Failed to send', 'error');
      }
    } catch {
      showToast('Gateway unreachable', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Broadcast ─────────────────────────────────────────────────────────────
  const toggleContact = (phone: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  };

  const selectAll = () => setSelectedContacts(new Set(contacts.map(c => c.phone)));
  const deselectAll = () => setSelectedContacts(new Set());

  const handleBroadcast = async () => {
    if (selectedContacts.size === 0 || !broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    setBroadcastResults(null);
    try {
      const r = await broadcastWhatsApp([...selectedContacts], broadcastMsg);
      setBroadcastResults(r.results);
      const sent = r.results.filter(x => x.success).length;
      showToast(`Broadcast complete: ${sent}/${r.total} delivered`);
    } catch {
      showToast('Broadcast failed — check gateway connection', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const useSampleMessage = () => {
    if (broadcastType === 'heat_alert') {
      setBroadcastMsg(formatHeatAlertMessage({
        residentName: '{Name}',
        locality: 'Your Area',
        tempC: 42,
        feelsLikeC: 48,
        riskCategory: 'critical',
        riskScore: 92,
        advice: 'Stay indoors. Drink water every 15–20 mins. Avoid direct sunlight.',
      }));
    } else if (broadcastType === 'emergency') {
      setBroadcastMsg(formatEmergencyAlertMessage({
        locality: 'Your City',
        headline: 'Extreme Heatwave Warning — Red Alert',
        description: 'Temperatures exceeding 44°C expected until 6 PM. All outdoor activities strongly discouraged.',
      }));
    } else if (broadcastType === 'briefing') {
      setBroadcastMsg(formatDailyBriefingMessage({
        locality: 'Bengaluru Urban',
        temp: 32,
        peakTemp: 36,
        riskLevel: 'High (Orange)',
        humidity: 50,
        rainChance: 10,
        peakHours: '12:00 PM – 4:00 PM',
        safetyAdvice: 'Drink water frequently, seek shaded transit routes, and avoid direct midday sun.'
      }));
    }
  };

  const handleTriggerDailyBriefing = async () => {
    setIsTriggeringBriefing(true);
    try {
      const res = await triggerDailyBriefing(true);
      if (res.success) {
        showToast(`6:00 AM Daily Briefing executed! Sent: ${res.sent}, Skipped: ${res.skipped}, Total: ${res.totalEligible}`);
        fetchDeliveryLogs().then(setLogs).catch(() => {});
      } else {
        showToast(res.error || 'Daily briefing dispatch failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger daily briefing', 'error');
    } finally {
      setIsTriggeringBriefing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect from WhatsApp? You will need to scan the QR again.')) return;
    await disconnectWhatsApp();
    showToast('Disconnected from WhatsApp');
    setStatus('logged_out');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const gatewayUrl = import.meta.env.VITE_WHATSAPP_GATEWAY_URL || 'http://localhost:3100';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 sm:px-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            <span>WhatsApp Notification Gateway</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Send heat alerts to residents via WhatsApp using your own number
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <StatusPill status={status} />
          <button
            onClick={refreshStatus}
            title="Refresh status"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Warning if gateway unreachable */}
      {status === 'unreachable' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">WhatsApp Gateway Not Running</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              The gateway service is not reachable at <code className="bg-amber-100 px-1 py-0.5 rounded">{gatewayUrl}</code>.
              Start it with the commands below, then refresh.
            </p>
            <div className="bg-amber-900 text-amber-100 text-xs font-mono rounded-lg p-3 mt-2 space-y-1">
              <div>cd whatsapp-service</div>
              <div>npm install</div>
              <div>cp .env.example .env <span className="text-amber-400"># set API_SECRET</span></div>
              <div>npm start</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-2 rounded-2xl border border-[#E5EDF5] shadow-xs overflow-x-auto">
        {([
          { key: 'connect',   label: 'Setup & Connect', icon: <Link2 className="w-3.5 h-3.5" /> },
          { key: 'contacts',  label: `Contacts (${contacts.length})`, icon: <Users className="w-3.5 h-3.5" /> },
          { key: 'broadcast', label: 'Broadcast',       icon: <Megaphone className="w-3.5 h-3.5" /> },
          { key: 'logs',      label: 'Delivery Logs',   icon: <History className="w-3.5 h-3.5" /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tab === key ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Setup & Connect ═══════════════════════════════════════════ */}
      {tab === 'connect' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code panel */}
          <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#25D366]" />
                Link Your WhatsApp Number
              </h2>
              <StatusPill status={status} />
            </div>

            {status === 'connected' && (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-900">WhatsApp Connected ✅</p>
                <p className="text-xs text-slate-500">Your number is linked and ready to send alerts.</p>
                <button
                  onClick={handleDisconnect}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Disconnect / Switch Number
                </button>
              </div>
            )}

            {(status === 'qr_ready') && qrImage && (
              <div className="text-center space-y-3">
                <div className="bg-white p-3 rounded-xl border-2 border-[#25D366] inline-block mx-auto">
                  <img src={qrImage} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  Open WhatsApp on your phone →{' '}
                  <span className="font-semibold">Linked Devices</span> →{' '}
                  <span className="font-semibold">Link a Device</span> → scan this QR
                </div>
                <div className="text-[11px] text-slate-400">QR refreshes automatically every 20 seconds</div>
              </div>
            )}

            {(status === 'connecting' || (status === 'qr_ready' && !qrImage)) && (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Connecting to WhatsApp… QR code loading shortly</p>
              </div>
            )}

            {status === 'logged_out' && (
              <div className="text-center py-8 space-y-3">
                <WifiOff className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Not Linked</p>
                <p className="text-xs text-slate-500">Restart the gateway service to generate a new QR code.</p>
              </div>
            )}
          </div>

          {/* Quick send panel */}
          <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#1E60F2]" />
              Quick Test Message
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  To (phone number, e.g. 919876543210)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={singleTo}
                    onChange={e => setSingleTo(e.target.value)}
                    placeholder="Country code + number, no spaces"
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Message</label>
                <textarea
                  value={singleMsg}
                  onChange={e => setSingleMsg(e.target.value)}
                  rows={5}
                  placeholder="Type your message…"
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20 resize-none"
                />
              </div>
              <button
                onClick={handleSendSingle}
                disabled={!singleTo || !singleMsg || status !== 'connected' || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1aad50] text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test Message
              </button>
              {status !== 'connected' && (
                <p className="text-[11px] text-amber-600 text-center">Connect WhatsApp first to send messages</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" /> How This Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Start the gateway', desc: 'Run npm start in the whatsapp-service folder. It launches a local Express server.' },
                { step: '2', title: 'Scan the QR code', desc: 'Scan with your WhatsApp phone. This links your number — exactly like WhatsApp Web.' },
                { step: '3', title: 'Add residents & broadcast', desc: 'Add mobile numbers, select contacts, and send heat alerts from the Broadcast tab.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#25D366] text-white text-xs font-black flex items-center justify-center shrink-0">{step}</div>
                  <div>
                    <p className="text-xs font-bold text-white">{title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Contacts ══════════════════════════════════════════════════ */}
      {tab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add contact form */}
          <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#1E60F2]" /> Add Resident Contact
            </h2>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name *</label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Country Code</label>
                  <input
                    value={addForm.countryCode}
                    onChange={e => setAddForm(f => ({ ...f, countryCode: e.target.value }))}
                    placeholder="91"
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Mobile Number *</label>
                  <input
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit mobile"
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Locality / Ward</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={addForm.locality}
                    onChange={e => setAddForm(f => ({ ...f, locality: e.target.value }))}
                    placeholder="e.g. Koramangala, Bengaluru"
                    className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20"
                  />
                </div>
              </div>

              {addError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {addError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1E60F2] hover:bg-[#184FD0] text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Contact
              </button>
            </form>
          </div>

          {/* Contact list */}
          <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Registered Contacts ({contacts.length})
              </h2>
              <button
                onClick={() => fetchContacts().then(setContacts)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-30" />
                <p>No contacts yet. Add your first resident above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {contacts.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                          <Phone className="w-3 h-3" />
                          +{c.countryCode} {c.phone.slice(c.countryCode.length)}
                        </span>
                        {c.locality && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />{c.locality}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveContact(c)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Broadcast ════════════════════════════════════════════════ */}
      {tab === 'broadcast' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact selector */}
          <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4" /> Select Recipients ({selectedContacts.size}/{contacts.length})
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-[11px] text-[#1E60F2] hover:underline">All</button>
                <span className="text-slate-300">|</span>
                <button onClick={deselectAll} className="text-[11px] text-slate-500 hover:underline">None</button>
              </div>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <Users className="w-7 h-7 mx-auto opacity-30" />
                <p>Add contacts first in the Contacts tab.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {contacts.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedContacts.has(c.phone)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-[#F5F8FC] border-[#E5EDF5] hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(c.phone)}
                      onChange={() => toggleContact(c.phone)}
                      className="w-3.5 h-3.5 accent-[#1E60F2]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-500">+{c.countryCode} {c.phone.slice(c.countryCode.length)}{c.locality ? ` · ${c.locality}` : ''}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Message composer */}
          <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#25D366]" /> Compose Broadcast
            </h2>

            {/* Template picker */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">Message Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { key: 'custom', label: '✏️ Custom' },
                  { key: 'heat_alert', label: '🌡️ Heat Alert' },
                  { key: 'emergency', label: '🚨 Emergency' },
                  { key: 'briefing', label: '☀️ 6 AM Briefing' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setBroadcastType(key); if (key !== 'custom') { setBroadcastMsg(''); setTimeout(useSampleMessage, 50); } }}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      broadcastType === key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Message</label>
              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                rows={10}
                placeholder="Type your WhatsApp message here…&#10;&#10;Tip: Use *bold*, _italic_, ~strikethrough~ formatting."
                className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]/20 resize-none font-mono"
              />
              <div className="text-[11px] text-slate-400 text-right mt-1">{broadcastMsg.length} chars</div>
            </div>

            <button
              onClick={handleBroadcast}
              disabled={selectedContacts.size === 0 || !broadcastMsg.trim() || status !== 'connected' || isBroadcasting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1aad50] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isBroadcasting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending to {selectedContacts.size} contacts…</>
                : <><Send className="w-4 h-4" /> Send to {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''}</>}
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Daily Routine:</span>
              <button
                type="button"
                onClick={handleTriggerDailyBriefing}
                disabled={isTriggeringBriefing}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isTriggeringBriefing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Trigger 6:00 AM Daily Briefing</span>
              </button>
            </div>

            {status !== 'connected' && (
              <p className="text-[11px] text-amber-600 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Connect WhatsApp first (Setup tab)
              </p>
            )}

            {/* Broadcast results */}
            {broadcastResults && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                <p className="text-xs font-bold text-slate-700 mb-2">Delivery Results:</p>
                {broadcastResults.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg text-[11px] ${r.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    <span>{r.phone}</span>
                    <span>{r.success ? '✅ Sent' : `❌ ${r.error}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: Logs ═════════════════════════════════════════════════════ */}
      {tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-[#E5EDF5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4" /> Delivery Logs
            </h2>
            <button
              onClick={() => fetchDeliveryLogs().then(setLogs)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <History className="w-8 h-8 mx-auto opacity-30" />
              <p>No messages sent yet. Delivery records will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E5EDF5] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.type === 'broadcast' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {log.type === 'broadcast' ? `📡 Broadcast (${log.count})` : `📤 Single → ${log.to}`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppGatewayPage;
