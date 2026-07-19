import React, { useState } from 'react';
import {
  Lock, Mail, Key, LayoutDashboard, Calendar, Users, Image as ImageIcon, Settings as SettingsIcon,
  Plus, Edit2, Trash2, Save, Download, Upload, CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Event, Member, GalleryItem, Settings } from '../types';

interface AdminViewProps {
  isAuthenticated: boolean;
  onLogin: (email: string, password: string) => Promise<boolean>;
  events: Event[];
  members: Member[];
  gallery: GalleryItem[];
  settings: Settings;
  onUpdateEvents: (updated: Event[]) => void;
  onUpdateMembers: (updated: Member[]) => void;
  onUpdateGallery: (updated: GalleryItem[]) => void;
  onUpdateSettings: (updated: Settings) => void;
  token: string | null;
}

type AdminTab = 'overview' | 'events' | 'committee' | 'gallery' | 'settings' | 'backup';

// ─── Shared design tokens, kept consistent with every other view in the app ───
const inputClass =
  "w-full bg-black/60 border border-neutral-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 transition-colors";
// [color-scheme:dark] tells the browser to render native controls (the date input's
// calendar icon/picker chrome, in particular) using light-on-dark colors — without it,
// Chromium/WebKit paint the picker icon dark-on-dark against this black UI and it's
// effectively invisible/unusable.
const dateInputClass = `${inputClass} [color-scheme:dark]`;
const labelClass = "text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5";
const cardClass =
  "relative rounded-2xl overflow-hidden p-6 bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-xl flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_28px_rgba(255,107,0,0.28)] transition-all duration-300 focus:outline-none";
const ghostBtnClass =
  "px-4 py-2.5 border border-neutral-800 hover:border-neutral-700 bg-black/40 text-neutral-400 hover:text-white rounded-xl text-xs font-mono transition-colors focus:outline-none";
const uploadBtnClass =
  "px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 rounded-xl text-xs font-mono cursor-pointer border border-white/10 flex items-center justify-center gap-1.5 transition-colors shrink-0";

// A native <input type="date"> only ever accepts/returns strict ISO "yyyy-mm-dd".
// If an event's stored date string isn't already in that format (e.g. seeded as a
// human-readable date, or edited outside this form), the browser can't parse it and
// silently shows an empty field — which looks exactly like "the date box is stuck".
// Normalize to ISO whenever we load a date into the form.
const toDateInputValue = (raw?: string): string => {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

export default function AdminView({
  isAuthenticated,
  onLogin,
  events,
  members,
  gallery,
  settings,
  onUpdateEvents,
  onUpdateMembers,
  onUpdateGallery,
  onUpdateSettings,
  token
}: AdminViewProps) {
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // CRUD Editing States
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Partial<Event>>({});

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<Member>>({});

  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({});

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Helper: Image file upload to server
  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: file.name,
              type: file.type,
              data: reader.result
            })
          });
          const result = await response.json();
          if (result.url) {
            resolve(result.url);
          } else {
            reject(new Error(result.error || 'Upload failed'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // --- ACTIONS ---

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setLoginError('Invalid administrator credentials.');
      }
    } catch (err) {
      setLoginError('An unexpected login error occurred.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 5.1 EVENT CRUD
  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingEventId;
    const url = isNew ? '/api/events' : `/api/events/${editingEventId}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });
      const saved = await response.json();
      if (response.ok) {
        if (isNew) {
          onUpdateEvents([...events, saved]);
        } else {
          onUpdateEvents(events.map(ev => ev.id === editingEventId ? saved : ev));
        }
        setEditingEventId(null);
        setEventForm({});
        showStatus(isNew ? 'Event created successfully!' : 'Event updated successfully!');
      } else {
        showStatus(saved.error || 'Failed to save event.', 'error');
      }
    } catch (err) {
      showStatus('API communication failed.', 'error');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this event?')) return;
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        onUpdateEvents(events.filter(ev => ev.id !== id));
        showStatus('Event deleted.');
      } else {
        showStatus('Failed to delete event.', 'error');
      }
    } catch (err) {
      showStatus('API communication failed.', 'error');
    }
  };

  // 5.2 COMMITTEE MEMBER CRUD
  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingMemberId;
    const url = isNew ? '/api/members' : `/api/members/${editingMemberId}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...memberForm,
          display_order: memberForm.display_order ? Number(memberForm.display_order) : 99
        })
      });
      const saved = await response.json();
      if (response.ok) {
        if (isNew) {
          onUpdateMembers([...members, saved]);
        } else {
          onUpdateMembers(members.map(m => m.id === editingMemberId ? saved : m));
        }
        setEditingMemberId(null);
        setMemberForm({});
        showStatus('Leadership record saved successfully!');
      } else {
        showStatus(saved.error || 'Failed to save member.', 'error');
      }
    } catch (err) {
      showStatus('API connection failed.', 'error');
    }
  };

  const deleteMember = async (id: string) => {
    if (!confirm('Delete this executive committee member?')) return;
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        onUpdateMembers(members.filter(m => m.id !== id));
        showStatus('Member removed from committee.');
      }
    } catch (err) {
      showStatus('API connection failed.', 'error');
    }
  };

  // 5.3 GALLERY CRUD
  const addGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image_url) {
      showStatus('Please specify an image URL or upload an image file.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(galleryForm)
      });
      const saved = await response.json();
      if (response.ok) {
        onUpdateGallery([...gallery, saved]);
        setGalleryForm({});
        showStatus('Photo added to gallery album.');
      }
    } catch (err) {
      showStatus('Connection failed.', 'error');
    }
  };

  const deleteGalleryItem = async (id: string) => {
    if (!confirm('Delete this photo from gallery?')) return;
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        onUpdateGallery(gallery.filter(g => g.id !== id));
        showStatus('Photo deleted.');
      }
    } catch (err) {
      showStatus('Connection failed.', 'error');
    }
  };

  // 5.4 WEBSITE SETTINGS SAVE
  const saveSettings = async (sectionKey: string, sectionData: any) => {
    const updatedSettings = {
      ...settings,
      ...sectionData
    };
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sectionData)
      });
      if (response.ok) {
        onUpdateSettings(updatedSettings);
        showStatus(`${sectionKey} settings updated!`);
      } else {
        showStatus('Failed to update settings.', 'error');
      }
    } catch (err) {
      showStatus('API failure.', 'error');
    }
  };

  // 5.5 DATABASE BACKUP UTILITY (Export & Import)
  const handleExportDb = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ admin: { email: settings.socialLinks?.email || "admin@sbce.ac.in", password: "admin" }, members, events, gallery, settings }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sbce_coding_club_db_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showStatus('Database backup JSON exported.');
  };

  const handleImportDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        const response = await fetch('/api/db/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ backupData })
        });
        const res = await response.json();
        if (response.ok) {
          onUpdateEvents(backupData.events || []);
          onUpdateMembers(backupData.members || []);
          onUpdateGallery(backupData.gallery || []);
          onUpdateSettings(backupData.settings || settings);
          showStatus('All tables restored successfully!');
        } else {
          showStatus(res.error || 'Failed to import backup.', 'error');
        }
      } catch (err) {
        showStatus('Parsing backup file failed.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // --- VISUAL VIEWS ---

  // Unauthenticated: SHOW LOGIN CARD (Glassmorphism styled)
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12" id="admin-login-container">
        <div
          className="w-full max-w-sm relative rounded-3xl overflow-hidden p-8 bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          id="login-card"
        >
          {/* Ambient corner glow, consistent with the rest of the site's glass panels */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120% 60% at 100% 0%, rgba(255,107,0,0.10), transparent 70%)' }}
            aria-hidden="true"
          />

          {/* Avatar frame */}
          <div className="relative flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white">Admin Headquarters</h1>
              <p className="text-neutral-500 text-xs mt-1">CSE SBCE Coding Club Portal</p>
            </div>
          </div>

          {loginError && (
            <div className="relative p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-start gap-2 mb-6 animate-shake" id="login-error-alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="relative space-y-4" id="login-form">
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="login-email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="admin@sbce.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="login-password">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  id="toggle-pwd-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-xl transition-all shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_28px_rgba(255,107,0,0.28)] disabled:opacity-50 focus:outline-none mt-6"
            >
              {isLoggingIn ? "Authorizing Session..." : "Verify Identity"}
            </button>
          </form>

          {/* Quick instructions containing default test credentials */}
          <div className="relative mt-8 border-t border-white/10 pt-4 text-center">
            <span className="text-[10px] font-mono text-orange-500 uppercase tracking-wider block mb-1">Developer Sandbox Info</span>
            <div className="bg-black/50 p-2 border border-white/10 rounded-xl text-[10px] text-neutral-500 font-mono flex flex-col gap-1 items-center">
              <span>Email: <b className="text-white">admin@sbce.ac.in</b></span>
              <span>Password: <b className="text-white">admin</b></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: SHOW THE DASHBOARD
  const tabConfig: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'events', label: 'Events CRUD', icon: Calendar },
    { id: 'committee', label: 'Committee CRUD', icon: Users },
    { id: 'gallery', label: 'Gallery CRUD', icon: ImageIcon },
    { id: 'settings', label: 'Web Settings', icon: SettingsIcon },
    { id: 'backup', label: 'DB Backup', icon: Download },
  ];

  const tabClasses = (tab: AdminTab) =>
    `relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-300 focus:outline-none shrink-0 ${
      activeTab === tab
        ? 'text-black font-bold'
        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
    }`;

  return (
    <div className="space-y-8 pb-20" id="admin-dashboard-root">
      {/* Status Bar */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl backdrop-blur-xl animate-slide-up ${
            statusMessage.type === 'success'
              ? 'bg-black/80 text-green-400 border-green-900/40'
              : 'bg-black/80 text-red-400 border-red-900/40'
          }`}
          id="dashboard-status-alert"
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-mono">{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-neutral-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="dashboard-header">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-orange-500" />
            Control Hub
          </h1>
          <p className="text-neutral-500 text-xs">Manage events, staff committee, albums, and website layout configurations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="dashboard-grid">
        {/* Left Sidebar Menu */}
        <div
          className="lg:col-span-3 flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none p-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
          id="dashboard-sidebar"
        >
          {tabConfig.map((tab) => (
            <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={tabClasses(tab.id)}>
              {activeTab === tab.id && (
                <span
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-600/90 to-orange-500/80 shadow-[0_0_16px_rgba(255,107,0,0.35)] -z-10"
                  id={`tab-active-pill-${tab.id}`}
                />
              )}
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Panel Workspace */}
        <div className={`lg:col-span-9 ${cardClass} md:p-8`} id="dashboard-workspace">

          {/* 1. OVERVIEW VIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8" id="view-overview">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Logistical Status Cards</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Total Events', value: events.length },
                  { label: 'Upcoming', value: events.filter(e => e.status !== 'Completed').length },
                  { label: 'Committee Roster', value: members.length },
                  { label: 'Gallery Photos', value: gallery.length },
                ].map((s) => (
                  <div key={s.label} className="bg-black/40 p-4 border border-white/10 rounded-xl hover:border-orange-500/20 transition-colors">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block">{s.label}</span>
                    <p className="text-2xl font-black text-white font-mono mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick instructions */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-white font-mono">Administration Instructions</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Welcome to your unified administration control panel. Any alterations made on this workspace (publishing events, managing staff avatars, assigning albums, or editing hero layouts) sync programmatically in real-time. Use the sidebar tabs to navigate individual modules.
                </p>
              </div>
            </div>
          )}

          {/* 2. EVENT CRUD VIEW */}
          {activeTab === 'events' && (
            <div className="space-y-8" id="view-events">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Events Roster Table</h2>
                <button
                  id="add-new-event-btn"
                  onClick={() => { setEditingEventId(''); setEventForm({ status: 'Upcoming' }); }}
                  className={primaryBtnClass}
                >
                  <Plus className="w-3.5 h-3.5" /> Publish New Event
                </button>
              </div>

              {editingEventId !== null ? (
                <form onSubmit={saveEvent} className="space-y-5" id="event-editor-form">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">
                    {editingEventId === '' ? 'Create New Event' : `Edit Event: ${editingEventId}`}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Event Title *</label>
                      <input
                        type="text"
                        required
                        value={eventForm.title || ''}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Event Status *</label>
                      <select
                        value={eventForm.status || 'Upcoming'}
                        onChange={(e: any) => setEventForm({ ...eventForm, status: e.target.value })}
                        className={inputClass}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={eventForm.description || ''}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className={`${inputClass} resize-none`}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Venue *</label>
                      <input
                        type="text"
                        required
                        value={eventForm.venue || ''}
                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Date *</label>
                      <input
                        type="date"
                        required
                        value={eventForm.date || ''}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className={dateInputClass}
                        id="input-event-date"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 09:30 AM"
                        value={eventForm.time || ''}
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Speaker / Guest Panel</label>
                      <input
                        type="text"
                        value={eventForm.speaker || ''}
                        onChange={(e) => setEventForm({ ...eventForm, speaker: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    {/* Banner upload / URL */}
                    <div>
                      <label className={labelClass}>Banner Image File or URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={eventForm.banner || ''}
                          onChange={(e) => setEventForm({ ...eventForm, banner: e.target.value })}
                          className={`${inputClass} flex-1`}
                        />
                        <label className={uploadBtnClass}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showStatus('Uploading banner file...');
                                  const url = await handleImageUpload(file);
                                  setEventForm({ ...eventForm, banner: url });
                                  showStatus('Banner uploaded successfully!');
                                } catch (err) {
                                  showStatus('Upload failed.', 'error');
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Google Form Registration URL</label>
                      <input
                        type="url"
                        value={eventForm.registration_link || ''}
                        onChange={(e) => setEventForm({ ...eventForm, registration_link: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Google Drive Certificate Folder URL</label>
                      <input
                        type="url"
                        value={eventForm.certificate_link || ''}
                        onChange={(e) => setEventForm({ ...eventForm, certificate_link: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => { setEditingEventId(null); setEventForm({}); }}
                      className={ghostBtnClass}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={primaryBtnClass}>
                      <Save className="w-3.5 h-3.5" /> Save Event
                    </button>
                  </div>
                </form>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10" id="events-table-wrapper">
                  <table className="w-full text-left text-xs text-neutral-400" id="events-dashboard-table">
                    <thead>
                      <tr className="border-b border-white/10 font-mono text-neutral-500 uppercase tracking-wider bg-white/[0.02]">
                        <th className="py-3 px-4">Event Banner / Title</th>
                        <th className="py-3 px-4">Venue & Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" id={`table-row-event-${ev.id}`}>
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img src={ev.banner} alt={ev.title} className="w-12 aspect-video object-cover rounded bg-neutral-900 shrink-0" />
                            <span className="font-bold text-white font-mono line-clamp-1">{ev.title}</span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span>{ev.date}</span><br />
                            <span className="text-[10px] text-neutral-600">{ev.venue}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 text-[9px] font-mono rounded ${
                              ev.status === 'Completed' ? 'bg-neutral-800 text-neutral-400' : 'bg-orange-600/20 text-orange-400'
                            }`}>{ev.status}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                id={`edit-event-btn-${ev.id}`}
                                onClick={() => { setEditingEventId(ev.id); setEventForm({ ...ev, date: toDateInputValue(ev.date) }); }}
                                className="p-1.5 bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.08] rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`delete-event-btn-${ev.id}`}
                                onClick={() => deleteEvent(ev.id)}
                                className="p-1.5 bg-white/[0.04] border border-white/10 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. COMMITTEE CRUD VIEW */}
          {activeTab === 'committee' && (
            <div className="space-y-8" id="view-committee">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Roster Management Table</h2>
                <button
                  id="add-new-member-btn"
                  onClick={() => { setEditingMemberId(''); setMemberForm({ display_order: 99 }); }}
                  className={primaryBtnClass}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Staff / Member
                </button>
              </div>

              {editingMemberId !== null ? (
                <form onSubmit={saveMember} className="space-y-5" id="member-editor-form">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">
                    {editingMemberId === '' ? 'Add Leader Record' : `Modify Leader: ${editingMemberId}`}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={memberForm.name || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Designation / Role *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chairman / Tech Lead"
                        value={memberForm.position || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Short Bio *</label>
                    <textarea
                      required
                      rows={3}
                      value={memberForm.bio || ''}
                      onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                      className={`${inputClass} resize-none`}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Profile Display Order Index *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 1 for Top, 99 for Standard"
                        value={memberForm.display_order ?? ''}
                        onChange={(e) => setMemberForm({ ...memberForm, display_order: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                    {/* Image URL / upload */}
                    <div>
                      <label className={labelClass}>Profile Image File or URL *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Image Link"
                          value={memberForm.image || ''}
                          onChange={(e) => setMemberForm({ ...memberForm, image: e.target.value })}
                          className={`${inputClass} flex-1`}
                        />
                        <label className={uploadBtnClass}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showStatus('Uploading avatar file...');
                                  const url = await handleImageUpload(file);
                                  setMemberForm({ ...memberForm, image: url });
                                  showStatus('Profile avatar saved!');
                                } catch (err) {
                                  showStatus('Upload failed.', 'error');
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>LinkedIn Link</label>
                      <input
                        type="url"
                        value={memberForm.linkedin || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, linkedin: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GitHub Link</label>
                      <input
                        type="url"
                        value={memberForm.github || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, github: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Instagram Link</label>
                      <input
                        type="url"
                        value={memberForm.instagram || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, instagram: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input
                        type="email"
                        value={memberForm.email || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => { setEditingMemberId(null); setMemberForm({}); }}
                      className={ghostBtnClass}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={primaryBtnClass}>
                      <Save className="w-3.5 h-3.5" /> Save Record
                    </button>
                  </div>
                </form>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10" id="members-table-wrapper">
                  <table className="w-full text-left text-xs text-neutral-400" id="members-dashboard-table">
                    <thead>
                      <tr className="border-b border-white/10 font-mono text-neutral-500 uppercase tracking-wider bg-white/[0.02]">
                        <th className="py-3 px-4">Profile Avatar / Name</th>
                        <th className="py-3 px-4">Position</th>
                        <th className="py-3 px-4">Order Index</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" id={`table-row-member-${m.id}`}>
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img src={m.image} alt={m.name} className="w-9 h-9 rounded-full object-cover bg-neutral-900 shrink-0" />
                            <span className="font-bold text-white font-mono">{m.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-orange-500/90">{m.position}</td>
                          <td className="py-3 px-4 font-mono">{m.display_order}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                id={`edit-member-btn-${m.id}`}
                                onClick={() => { setEditingMemberId(m.id); setMemberForm(m); }}
                                className="p-1.5 bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.08] rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`delete-member-btn-${m.id}`}
                                onClick={() => deleteMember(m.id)}
                                className="p-1.5 bg-white/[0.04] border border-white/10 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. GALLERY CRUD VIEW */}
          {activeTab === 'gallery' && (
            <div className="space-y-8" id="view-gallery">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Publish Photographs</h2>

              <form onSubmit={addGalleryItem} className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4" id="gallery-uploader-form">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">Append New Image File</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select target album */}
                  <div>
                    <label className={labelClass}>Associate with Event Album *</label>
                    <select
                      value={galleryForm.event_id || 'all'}
                      onChange={(e) => setGalleryForm({ ...galleryForm, event_id: e.target.value })}
                      className={inputClass}
                    >
                      <option value="all">General Club Activities</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Image input/upload */}
                  <div>
                    <label className={labelClass}>Image Source URL or File *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={galleryForm.image_url || ''}
                        onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                        className={`${inputClass} flex-1 font-mono`}
                      />
                      <label className={uploadBtnClass}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                showStatus('Uploading gallery picture...');
                                const url = await handleImageUpload(file);
                                setGalleryForm({ ...galleryForm, image_url: url });
                                showStatus('Picture loaded successfully!');
                              } catch (err) {
                                showStatus('Upload failed.', 'error');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Caption *</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of this specific event photograph..."
                    value={galleryForm.caption || ''}
                    onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <button id="submit-gallery-btn" type="submit" className={primaryBtnClass}>
                  <Plus className="w-3.5 h-3.5" /> Publish Photograph
                </button>
              </form>

              {/* Roster of active gallery items */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">Live Photographs Grid</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="gallery-editor-grid">
                  {gallery.map(img => (
                    <div key={img.id} className="bg-black/40 border border-white/10 p-2.5 rounded-xl flex flex-col justify-between hover:border-orange-500/20 transition-colors" id={`gallery-row-${img.id}`}>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-950 mb-2">
                        <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-neutral-500 text-[10px] font-mono uppercase">Album: {img.event_id}</p>
                        <p className="text-white text-xs line-clamp-2 leading-relaxed">{img.caption}</p>
                        <button
                          id={`delete-gallery-btn-${img.id}`}
                          onClick={() => deleteGalleryItem(img.id)}
                          className="w-full mt-2 py-1.5 bg-black/40 hover:bg-red-950/20 text-neutral-500 hover:text-red-400 border border-white/10 hover:border-red-900/30 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Picture
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. WEBSITE LAYOUT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8" id="view-settings">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Website Settings Manager</h2>

              {/* Hero Section Config */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">5.4.1 Hero Landing Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Main Title Text</label>
                    <input
                      id="input-hero-text"
                      type="text"
                      defaultValue={settings.heroText}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Sub-heading Label</label>
                    <input
                      id="input-hero-subtext"
                      type="text"
                      defaultValue={settings.heroSubtext}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Mission Description Tagline</label>
                  <textarea
                    id="input-hero-tagline"
                    rows={2}
                    defaultValue={settings.heroTagline}
                    className={`${inputClass} resize-none`}
                  ></textarea>
                </div>
                <button
                  id="save-hero-settings-btn"
                  onClick={() => {
                    const heroText = (document.getElementById('input-hero-text') as HTMLInputElement).value;
                    const heroSubtext = (document.getElementById('input-hero-subtext') as HTMLInputElement).value;
                    const heroTagline = (document.getElementById('input-hero-tagline') as HTMLTextAreaElement).value;
                    saveSettings('Hero', { heroText, heroSubtext, heroTagline });
                  }}
                  className={primaryBtnClass}
                >
                  <Save className="w-3.5 h-3.5" /> Save Hero layout
                </button>
              </div>

              {/* Statistics settings */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">5.4.2 Metric Stat Counter Numbers</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className={labelClass}>Members</label>
                    <input id="input-stat-members" type="number" defaultValue={settings.statistics?.members || 240} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>Events</label>
                    <input id="input-stat-events" type="number" defaultValue={settings.statistics?.events || 28} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>Hackathons</label>
                    <input id="input-stat-hacks" type="number" defaultValue={settings.statistics?.hackathons || 5} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>Projects</label>
                    <input id="input-stat-projects" type="number" defaultValue={settings.statistics?.projects || 12} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>Years Active</label>
                    <input id="input-stat-years" type="number" defaultValue={settings.statistics?.yearsActive || 5} className={`${inputClass} font-mono`} />
                  </div>
                </div>
                <button
                  id="save-stats-settings-btn"
                  onClick={() => {
                    const membersNum = Number((document.getElementById('input-stat-members') as HTMLInputElement).value);
                    const eventsNum = Number((document.getElementById('input-stat-events') as HTMLInputElement).value);
                    const hackathonsNum = Number((document.getElementById('input-stat-hacks') as HTMLInputElement).value);
                    const projectsNum = Number((document.getElementById('input-stat-projects') as HTMLInputElement).value);
                    const yearsActiveNum = Number((document.getElementById('input-stat-years') as HTMLInputElement).value);

                    saveSettings('Statistics', {
                      statistics: {
                        members: membersNum,
                        events: eventsNum,
                        hackathons: hackathonsNum,
                        projects: projectsNum,
                        yearsActive: yearsActiveNum
                      }
                    });
                  }}
                  className={primaryBtnClass}
                >
                  <Save className="w-3.5 h-3.5" /> Save Statistics
                </button>
              </div>

              {/* Contact config */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">5.4.3 Institutional Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email Desk Address</label>
                    <input id="input-link-email" type="email" defaultValue={settings.socialLinks?.email} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>Instagram Username URL</label>
                    <input id="input-link-insta" type="url" defaultValue={settings.socialLinks?.instagram} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>LinkedIn Company URL</label>
                    <input id="input-link-linkd" type="url" defaultValue={settings.socialLinks?.linkedin} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <label className={labelClass}>GitHub Organization URL</label>
                    <input id="input-link-githb" type="url" defaultValue={settings.socialLinks?.github} className={`${inputClass} font-mono`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Embedded Google Map Embed URL (Iframe Src)</label>
                  <input id="input-link-map" type="text" defaultValue={settings.socialLinks?.mapEmbedUrl} className={`${inputClass} font-mono`} />
                </div>
                <button
                  id="save-socials-settings-btn"
                  onClick={() => {
                    const emailL = (document.getElementById('input-link-email') as HTMLInputElement).value;
                    const instaL = (document.getElementById('input-link-insta') as HTMLInputElement).value;
                    const linkdL = (document.getElementById('input-link-linkd') as HTMLInputElement).value;
                    const githbL = (document.getElementById('input-link-githb') as HTMLInputElement).value;
                    const mapL = (document.getElementById('input-link-map') as HTMLInputElement).value;

                    saveSettings('Social Links', {
                      socialLinks: {
                        email: emailL,
                        instagram: instaL,
                        linkedin: linkdL,
                        github: githbL,
                        mapEmbedUrl: mapL,
                        location: settings.socialLinks?.location || "Sree Buddha College of Engineering, Pattoor, Nooranad, Alappuzha, Kerala - 690529"
                      }
                    });
                  }}
                  className={primaryBtnClass}
                >
                  <Save className="w-3.5 h-3.5" /> Save Socials
                </button>
              </div>
            </div>
          )}

          {/* 6. DATABASE BACKUP AND RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-8" id="view-backup">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Database Protection</h2>
              <p className="text-neutral-400 text-xs leading-relaxed">
                As the runtime is containerized and stateless, local storage or internal variables could occasionally scale down or refresh. Protect your curated layout by saving backups locally. You can restore this entire platform to any previous state in seconds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Export Card */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-4 flex flex-col justify-between hover:border-orange-500/20 transition-colors" id="backup-export-card">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white font-mono">1. Export Entire Database</h3>
                    <p className="text-neutral-500 text-xs">Downloads a single, structured `.json` backup file containing your administration profile, events roster, staff profiles, gallery albums, and settings parameters.</p>
                  </div>
                  <button
                    id="export-db-btn"
                    onClick={handleExportDb}
                    className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs font-mono rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4 text-orange-500" /> Export Database JSON
                  </button>
                </div>

                {/* Import Card */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-4 flex flex-col justify-between hover:border-orange-500/20 transition-colors" id="backup-import-card">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white font-mono">2. Restore Database Backup</h3>
                    <p className="text-neutral-500 text-xs">Restore all configurations, events, members, and details. This will overwrite current workspace states with parameters specified in the loaded backup.</p>
                  </div>
                  <label className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs font-mono rounded-xl border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-orange-500" /> Restore Database Backup
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportDb}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
