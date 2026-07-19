import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, Key, LayoutDashboard, Calendar, Users, Image as ImageIcon, Settings as SettingsIcon, 
  Plus, Edit2, Trash2, Save, Download, Upload, CheckCircle2, AlertCircle, Eye, EyeOff, FolderOpen,
  UserCheck, ShieldAlert, History, UserX, AlertOctagon, UserPlus, Clock
} from 'lucide-react';
import { Event, Member, GalleryItem, Settings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDocs
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '../services/firebase';

interface AdminViewProps {
  isAuthenticated: boolean;
  onLogin: () => Promise<void>;
  currentUser: any | null;
  accessRequest: any | null;
  onLogout: () => Promise<void>;
  events: Event[];
  members: Member[];
  gallery: GalleryItem[];
  settings: Settings;
  onUpdateEvents: (updated: Event[]) => void;
  onUpdateMembers: (updated: Member[]) => void;
  onUpdateGallery: (updated: GalleryItem[]) => void;
  onUpdateSettings: (updated: Settings) => void;
  token: string;
  path: string;
  navigate: (path: string) => void;
}

type AdminTab = 'overview' | 'events' | 'committee' | 'gallery' | 'settings' | 'backup' | 'admins' | 'requests' | 'activity';

// Reusable Image Preview component with Loading & Error States
const ImagePreview = ({ url }: { url: string }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url || !url.startsWith('http')) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    const img = new Image();
    img.src = url;
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="mt-2 relative w-32 aspect-video rounded-lg overflow-hidden bg-neutral-900 border border-neutral-850 flex items-center justify-center">
      {loading && <div className="text-[10px] font-mono text-neutral-500">Loading...</div>}
      {error && <div className="text-[10px] font-mono text-neutral-600 text-center px-1">No Image Preview</div>}
      {!loading && !error && <img src={url} alt="Preview" className="w-full h-full object-cover" />}
    </div>
  );
};

export default function AdminView({
  isAuthenticated,
  onLogin,
  currentUser,
  accessRequest,
  onLogout,
  events,
  members,
  gallery,
  settings,
  onUpdateEvents,
  onUpdateMembers,
  onUpdateGallery,
  onUpdateSettings,
  path,
  navigate
}: AdminViewProps) {
  const { user, adminRecord, logout } = useAuth();

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Just now';
    if (typeof ts === 'object' && ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? 'Just now' : parsed.toLocaleString();
  };

  const formatTimeOnly = (ts: any) => {
    if (!ts) return 'Just now';
    if (typeof ts === 'object' && ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleTimeString();
    }
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? 'Just now' : parsed.toLocaleTimeString();
  };

  // Login States
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Active Tab synced with Router
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Firestore collections loaded in real-time
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Filtering for Admin requests tab
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // CRUD Editing States
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Partial<Event>>({});

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<Member>>({});

  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({});

  // Sync activeTab with URL Path changes
  useEffect(() => {
    if (path === '/admin/events') setActiveTab('events');
    else if (path === '/admin/execom') setActiveTab('committee');
    else if (path === '/admin/gallery') setActiveTab('gallery');
    else if (path === '/admin/settings') setActiveTab('settings');
    else if (path === '/admin/backup') setActiveTab('backup');
    else if (path === '/admin/admins') setActiveTab('admins');
    else if (path === '/admin/access-requests') setActiveTab('requests');
    else if (path === '/admin/activity') setActiveTab('activity');
    else setActiveTab('overview');
  }, [path]);

  // Real-time Listeners for Admin sections (only if authenticated & authorized)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen to Admins
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push(d.data()));
      setAdminsList(list);
    });

    // Listen to Access Requests
    const unsubRequests = onSnapshot(collection(db, 'adminAccessRequests'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push(d.data()));
      setRequestsList(list);
    });

    // Listen to Audit Logs
    const qLogs = query(collection(db, 'adminAuditLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setAuditLogs(list);
    });

    return () => {
      unsubAdmins();
      unsubRequests();
      unsubLogs();
    };
  }, [isAuthenticated]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Helper: Write administrative activity log
  const logAdminAction = async (action: string, targetType: string, targetId: string, targetName: string, metadata: any = {}) => {
    try {
      await addDoc(collection(db, 'adminAuditLogs'), {
        action,
        targetType,
        targetId,
        targetName,
        performedByUid: user?.uid || 'Unknown',
        performedByEmail: user?.email || 'Unknown',
        timestamp: serverTimestamp(),
        metadata
      });
    } catch (err) {
      console.error('Audit logger failed:', err);
    }
  };

  // Handle Google Login Flow
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await onLogin();
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'An error occurred during Google sign-in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Check if current user is super_admin
  const isSuperAdmin = adminRecord?.role === 'super_admin';

  // 1. EVENT CRUD
  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingEventId;
    const eventId = isNew ? 'e' + Date.now() : editingEventId;
    const docRef = doc(db, 'events', eventId);

    const payload = {
      id: eventId,
      title: eventForm.title || 'Untitled Event',
      description: eventForm.description || '',
      banner: eventForm.banner || 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=800&auto=format&fit=crop&q=80',
      venue: eventForm.venue || '',
      date: eventForm.date || '',
      time: eventForm.time || '',
      speaker: eventForm.speaker || '',
      status: eventForm.status || 'Upcoming',
      registration_link: eventForm.registration_link || '',
      certificate_link: eventForm.certificate_link || '',
      created_at: eventForm.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(docRef, payload);
      setEditingEventId(null);
      setEventForm({});
      
      const actionLabel = isNew ? 'Event Created' : 'Event Updated';
      await logAdminAction(actionLabel, 'event', eventId, payload.title);
      showStatus(isNew ? 'Event created successfully!' : 'Event updated successfully!');
    } catch (err: any) {
      showStatus('Failed to write event document: ' + err.message, 'error');
    }
  };

  const deleteEvent = async (id: string) => {
    const eventTitle = events.find(ev => ev.id === id)?.title || id;
    if (!confirm('Are you absolutely sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      await logAdminAction('Event Deleted', 'event', id, eventTitle);
      showStatus('Event deleted successfully.');
    } catch (err: any) {
      showStatus('Failed to delete event: ' + err.message, 'error');
    }
  };

  // 2. COMMITTEE MEMBER CRUD
  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingMemberId;
    const memberId = isNew ? 'm' + Date.now() : editingMemberId;
    const docRef = doc(db, 'execom', memberId);

    const payload = {
      id: memberId,
      name: memberForm.name || 'Anonymous',
      position: memberForm.position || 'Member',
      bio: memberForm.bio || '',
      image: memberForm.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=80',
      linkedin: memberForm.linkedin || '',
      github: memberForm.github || '',
      instagram: memberForm.instagram || '',
      email: memberForm.email || '',
      display_order: memberForm.display_order ? Number(memberForm.display_order) : 99,
      created_at: (memberForm as any).created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await setDoc(docRef, payload);
      setEditingMemberId(null);
      setMemberForm({});
      
      const actionLabel = isNew ? 'Execom Member Created' : 'Execom Member Updated';
      await logAdminAction(actionLabel, 'execom', memberId, payload.name);
      showStatus('Committee member record saved successfully!');
    } catch (err: any) {
      showStatus('Failed to write execom document: ' + err.message, 'error');
    }
  };

  const deleteMember = async (id: string) => {
    const memberName = members.find(m => m.id === id)?.name || id;
    if (!confirm('Delete this executive committee member?')) return;
    try {
      await deleteDoc(doc(db, 'execom', id));
      await logAdminAction('Execom Member Deleted', 'execom', id, memberName);
      showStatus('Member removed from committee roster.');
    } catch (err: any) {
      showStatus('Failed to delete committee member: ' + err.message, 'error');
    }
  };

  // 3. GALLERY CRUD
  const addGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image_url) {
      showStatus('Please specify a direct image URL.', 'error');
      return;
    }
    const itemId = 'g' + Date.now();
    const docRef = doc(db, 'gallery', itemId);

    const payload = {
      id: itemId,
      event_id: galleryForm.event_id || 'all',
      image_url: galleryForm.image_url || '',
      caption: galleryForm.caption || 'No Caption',
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(docRef, payload);
      setGalleryForm({});
      await logAdminAction('Gallery Item Created', 'gallery', itemId, payload.caption);
      showStatus('Photo appended to gallery album.');
    } catch (err: any) {
      showStatus('Failed to add gallery photo: ' + err.message, 'error');
    }
  };

  const deleteGalleryItem = async (id: string) => {
    const itemCaption = gallery.find(g => g.id === id)?.caption || id;
    if (!confirm('Delete this photo from gallery?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      await logAdminAction('Gallery Item Deleted', 'gallery', id, itemCaption);
      showStatus('Photo deleted from gallery.');
    } catch (err: any) {
      showStatus('Failed to delete gallery item: ' + err.message, 'error');
    }
  };

  // 4. WEBSITE SETTINGS SAVE
  const saveSettings = async (sectionKey: string, sectionData: any) => {
    const updatedSettings = {
      ...settings,
      ...sectionData
    };
    try {
      await setDoc(doc(db, 'settings', 'site'), updatedSettings);
      onUpdateSettings(updatedSettings);
      await logAdminAction('Settings Updated', 'settings', 'site', sectionKey);
      showStatus(`${sectionKey} settings updated!`);
    } catch (err: any) {
      showStatus('Failed to update website settings: ' + err.message, 'error');
    }
  };

  // 5. DATABASE BACKUP AND RESTORE
  const handleExportDb = () => {
    const backupObj = {
      events,
      members,
      gallery,
      settings
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
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
        if (!backupData.events || !backupData.members || !backupData.gallery || !backupData.settings) {
          showStatus('Invalid backup file format.', 'error');
          return;
        }

        // Restore Settings
        await setDoc(doc(db, 'settings', 'site'), backupData.settings);
        
        // Restore Events
        for (const ev of backupData.events) {
          await setDoc(doc(db, 'events', ev.id), ev);
        }

        // Restore Execom
        for (const mem of backupData.members) {
          await setDoc(doc(db, 'execom', mem.id), mem);
        }

        // Restore Gallery
        for (const gal of backupData.gallery) {
          await setDoc(doc(db, 'gallery', gal.id), gal);
        }

        await logAdminAction('Database Restored', 'database', 'restore', `Imported ${file.name}`);
        showStatus('All tables restored successfully!');
      } catch (err: any) {
        showStatus('Restore failed: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  // --- 6. SECURE ADMIN ACCESS APPROVAL WORKFLOWS ---
  
  // Helper to count active super_admins in the database
  const countActiveSuperAdmins = () => {
    return adminsList.filter(a => a.role === 'super_admin' && a.status === 'active').length;
  };

  const handleApproveRequest = async (request: any) => {
    if (!user) return;
    if (!isSuperAdmin) {
      showStatus('Only Super Administrators are authorized to approve access requests.', 'error');
      return;
    }
    if (request.uid === user?.uid) {
      showStatus('Operation Blocked: You cannot approve your own access request.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to approve administrator access for ${request.displayName} (${request.email})?`)) return;

    try {
      const now = new Date().toISOString();
      
      // 1. Write the new admin to the admins collection
      await setDoc(doc(db, 'admins', request.uid), {
        uid: request.uid,
        email: request.email,
        displayName: request.displayName,
        role: 'admin', // approved as standard admin by default
        status: 'active',
        approvedBy: user.email,
        approvedAt: now,
        createdAt: now,
        updatedAt: now
      });

      // 2. Update status of the access request to approved
      await updateDoc(doc(db, 'adminAccessRequests', request.uid), {
        status: 'approved',
        reviewedBy: user.email,
        reviewedAt: now
      });

      await logAdminAction('Access Request Approved', 'admin', request.uid, request.email, { approvedBy: user.email });
      showStatus(`Approved access for: ${request.displayName}`);
    } catch (err: any) {
      showStatus('Failed to approve request: ' + err.message, 'error');
    }
  };

  const handleRejectRequest = async (request: any) => {
    if (!user) return;
    if (!isSuperAdmin) {
      showStatus('Only Super Administrators are authorized to reject requests.', 'error');
      return;
    }
    const reason = prompt('Please specify a rejection reason (optional):') || '';
    if (!confirm(`Reject administrator access for ${request.displayName} (${request.email})?`)) return;

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'adminAccessRequests', request.uid), {
        status: 'rejected',
        reviewedBy: user.email,
        reviewedAt: now,
        rejectionReason: reason || 'Not approved by super administrator.'
      });

      await logAdminAction('Access Request Rejected', 'admin_request', request.uid, request.email, { reason });
      showStatus(`Rejected request for: ${request.displayName}`);
    } catch (err: any) {
      showStatus('Failed to reject request: ' + err.message, 'error');
    }
  };

  const handleChangeRole = async (targetAdmin: any, newRole: 'super_admin' | 'admin') => {
    if (!user) return;
    if (!isSuperAdmin) {
      showStatus('Operation Denied: Super Admin permissions required.', 'error');
      return;
    }
    if (targetAdmin.uid === user?.uid) {
      showStatus('Operation Blocked: You cannot change your own administrative role.', 'error');
      return;
    }

    // If downgrading a super_admin, verify it's not the final active super_admin
    if (targetAdmin.role === 'super_admin' && newRole === 'admin') {
      const superAdminCount = countActiveSuperAdmins();
      if (superAdminCount <= 1 && targetAdmin.status === 'active') {
        showStatus('Operation Denied: The system requires at least one active Super Administrator.', 'error');
        return;
      }
    }

    if (!confirm(`Change administrative role of ${targetAdmin.displayName} to ${newRole}?`)) return;

    try {
      // Update admin role document
      await updateDoc(doc(db, 'admins', targetAdmin.uid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      // Keep configuration metadata sync
      const metaRef = doc(db, 'metadata', 'admin_config');
      if (newRole === 'super_admin') {
        await updateDoc(metaRef, { superAdmins: arrayUnion(targetAdmin.uid) });
      } else {
        await updateDoc(metaRef, { superAdmins: arrayRemove(targetAdmin.uid) });
      }

      await logAdminAction('Admin Role Changed', 'admin', targetAdmin.uid, targetAdmin.email, { from: targetAdmin.role, to: newRole });
      showStatus(`Role changed for ${targetAdmin.displayName} to ${newRole}`);
    } catch (err: any) {
      showStatus('Failed to update role: ' + err.message, 'error');
    }
  };

  const handleToggleAdminStatus = async (targetAdmin: any) => {
    if (!isSuperAdmin) {
      showStatus('Operation Denied: Super Admin permissions required.', 'error');
      return;
    }
    if (targetAdmin.uid === user?.uid) {
      showStatus('Operation Blocked: You cannot modify your own administrative status.', 'error');
      return;
    }

    const currentStatus = targetAdmin.status;
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';

    // If disabling a super_admin, check it is not the final active one
    if (targetAdmin.role === 'super_admin' && newStatus === 'disabled') {
      const superAdminCount = countActiveSuperAdmins();
      if (superAdminCount <= 1) {
        showStatus('Operation Denied: The system requires at least one active Super Administrator.', 'error');
        return;
      }
    }

    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} admin access for ${targetAdmin.displayName}?`)) return;

    try {
      await updateDoc(doc(db, 'admins', targetAdmin.uid), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      const actionText = newStatus === 'active' ? 'Admin Re-enabled' : 'Admin Disabled';
      await logAdminAction(actionText, 'admin', targetAdmin.uid, targetAdmin.email);
      showStatus(`Admin ${targetAdmin.displayName} is now ${newStatus}`);
    } catch (err: any) {
      showStatus('Failed to change status: ' + err.message, 'error');
    }
  };

  const handleRemoveAdminAccess = async (targetAdmin: any) => {
    if (!isSuperAdmin) {
      showStatus('Operation Denied: Super Admin permissions required.', 'error');
      return;
    }
    if (targetAdmin.uid === user?.uid) {
      showStatus('Operation Blocked: You cannot remove your own administrative access.', 'error');
      return;
    }

    // Check last super_admin safety
    if (targetAdmin.role === 'super_admin' && targetAdmin.status === 'active') {
      const superAdminCount = countActiveSuperAdmins();
      if (superAdminCount <= 1) {
        showStatus('Operation Denied: The system requires at least one active Super Administrator.', 'error');
        return;
      }
    }

    if (!confirm(`Are you sure you want to PERMANENTLY REMOVE admin access for ${targetAdmin.displayName}? This deletes their credentials.`)) return;

    try {
      // 1. Delete admin document from admins collection
      await deleteDoc(doc(db, 'admins', targetAdmin.uid));

      // 2. Remove from metadata superAdmins list just in case
      await updateDoc(doc(db, 'metadata', 'admin_config'), {
        superAdmins: arrayRemove(targetAdmin.uid)
      });

      // 3. Reset request status back to rejected/pending or just delete it
      await deleteDoc(doc(db, 'adminAccessRequests', targetAdmin.uid));

      await logAdminAction('Admin Access Removed', 'admin', targetAdmin.uid, targetAdmin.email);
      showStatus(`Removed administrator access for: ${targetAdmin.displayName}`);
    } catch (err: any) {
      showStatus('Failed to remove admin access: ' + err.message, 'error');
    }
  };

  // --- VIEWS ---

  // Signed in but not yet approved: SHOW ACCESS PENDING CARD
  if (currentUser && !isAuthenticated) {
    const isRejected = accessRequest?.status === 'rejected';
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12" id="admin-pending-container">
        <div className="w-full max-w-md bg-black/60 backdrop-blur-md border border-neutral-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,107,0,0.05)] text-center space-y-6 relative overflow-hidden" id="pending-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-orange-500 mx-auto shadow-lg">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-mono text-white">Access Verification</h1>
            <p className="text-neutral-500 text-xs">Signed in as: <span className="text-neutral-300 font-mono">{currentUser?.email}</span></p>
          </div>
          <div className="p-5 bg-neutral-950/80 border border-neutral-900 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider">Request Status</span>
            {isRejected ? (
              <p className="text-red-500 font-bold font-mono">REJECTED</p>
            ) : (
              <p className="text-orange-500 font-bold font-mono animate-pulse">PENDING REVIEW</p>
            )}
            <p className="text-neutral-400 mt-2 leading-relaxed text-left">
              {isRejected
                ? `Your administrator access request was not approved. ${accessRequest?.rejectionReason ? `Reason: ${accessRequest.rejectionReason}` : 'Please contact the super administrator to reconsider your request.'}`
                : 'Your account does not currently have administrator access. Your access request has been recorded and will be reviewed by an existing Super Administrator.'}
            </p>
          </div>
          {!isRejected && (
            <div className="p-3 bg-orange-950/20 border border-orange-900/30 text-orange-400 text-xs rounded-lg text-left">
              <p className="font-mono font-bold mb-1">What happens next?</p>
              <p>A Super Admin will approve your account. You will automatically gain access once approved — no need to sign in again.</p>
            </div>
          )}
          <button
            id="pending-logout-btn"
            onClick={onLogout}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-xs font-mono rounded-xl transition-all cursor-pointer"
          >
            Sign Out &amp; Use a Different Account
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated: SHOW LOGIN CARD (Google Sign-In only)
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12" id="admin-login-container">
        <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-neutral-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,107,0,0.05)] relative overflow-hidden text-center" id="login-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-orange-500 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white">Admin Control</h1>
              <p className="text-neutral-500 text-xs mt-1">CSE SBCE Coding Club Portal</p>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg flex items-start gap-2 mb-6 text-left" id="login-error-alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-neutral-400 text-xs leading-relaxed">
              Access is restricted to authorized administrators. Sign in with your registered Google account to access the Control Hub.
            </p>

            <button
              id="google-login-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full py-3 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs font-mono rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus:outline-none"
            >
              {isLoggingIn ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-neutral-500 leading-normal">
              If your account is not authorized, a pending access request will be queued automatically for Super Admin approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Count pending requests for notification badge
  const pendingRequestsCount = requestsList.filter(r => r.status === 'pending').length;

  // Authenticated: SHOW THE DASHBOARD
  const tabClasses = (tab: AdminTab) => 
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono transition-all focus:outline-none cursor-pointer w-full text-left ${
      activeTab === tab 
        ? 'bg-orange-600 text-black font-bold shadow-md shadow-orange-600/15' 
        : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
    }`;

  // Helper to map tab identifier to URL routing
  const navigateToTab = (tab: AdminTab) => {
    if (tab === 'overview') navigate('/admin/dashboard');
    else if (tab === 'committee') navigate('/admin/execom');
    else navigate(`/admin/${tab}`);
  };

  return (
    <div className="space-y-8 pb-20" id="admin-dashboard-root">
      {/* Status Alert Popup */}
      {statusMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-slide-up bg-zinc-950 ${
            statusMessage.type === 'success' 
              ? 'text-green-400 border-green-900/40' 
              : 'text-red-400 border-red-900/40'
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
          <p className="text-neutral-500 text-xs">
            Logged in as: <span className="text-neutral-300 font-mono">{user?.email}</span> ({adminRecord?.role})
          </p>
        </div>
        
        {/* Quick notification alert */}
        {pendingRequestsCount > 0 && (
          <button
            onClick={() => navigateToTab('requests')}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 border border-orange-500/20 text-orange-400 text-xs font-mono rounded-lg hover:bg-orange-600 hover:text-black transition-all cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            <span>{pendingRequestsCount} Pending Access Requests</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="dashboard-grid">
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" id="dashboard-sidebar">
          <button id="tab-overview" onClick={() => navigateToTab('overview')} className={tabClasses('overview')}>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>
          
          <button id="tab-events" onClick={() => navigateToTab('events')} className={tabClasses('events')}>
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Events CRUD</span>
          </button>
          
          <button id="tab-committee" onClick={() => navigateToTab('committee')} className={tabClasses('committee')}>
            <Users className="w-4 h-4 shrink-0" />
            <span>Committee CRUD</span>
          </button>
          
          <button id="tab-gallery" onClick={() => navigateToTab('gallery')} className={tabClasses('gallery')}>
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Gallery CRUD</span>
          </button>
          
          <button id="tab-settings" onClick={() => navigateToTab('settings')} className={tabClasses('settings')}>
            <SettingsIcon className="w-4 h-4 shrink-0" />
            <span>Web Settings</span>
          </button>
          
          {/* Access Requests Sub-tab */}
          <button id="tab-requests" onClick={() => navigateToTab('requests')} className={tabClasses('requests')}>
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Access Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-auto bg-orange-600 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          
          {/* Admins list sub-tab */}
          <button id="tab-admins" onClick={() => navigateToTab('admins')} className={tabClasses('admins')}>
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Administrators</span>
          </button>

          {/* Activity Logs sub-tab */}
          <button id="tab-activity" onClick={() => navigateToTab('activity')} className={tabClasses('activity')}>
            <History className="w-4 h-4 shrink-0" />
            <span>Audit History</span>
          </button>
          
          <button id="tab-backup" onClick={() => navigateToTab('backup')} className={tabClasses('backup')}>
            <Download className="w-4 h-4 shrink-0" />
            <span>DB Backup</span>
          </button>
        </div>
 
        {/* Right Panel Workspace */}
        <div className="lg:col-span-9 bg-zinc-950/40 border border-neutral-900 rounded-xl p-6 md:p-8" id="dashboard-workspace">
          
          {/* 1. OVERVIEW VIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8" id="view-overview">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Logistical Status Cards</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-black p-4 border border-neutral-900 rounded-lg">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Total Events</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{events.length || 0}</p>
                </div>
                <div className="bg-black p-4 border border-neutral-900 rounded-lg">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Upcoming</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{events.filter(e => e.status !== 'Completed').length || 0}</p>
                </div>
                <div className="bg-black p-4 border border-neutral-900 rounded-lg">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Committee Roster</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{members.length || 0}</p>
                </div>
                <div className="bg-black p-4 border border-neutral-900 rounded-lg">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Gallery Photos</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{gallery.length || 0}</p>
                </div>
              </div>

              {/* Quick instructions */}
              <div className="bg-black border border-neutral-900 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold text-white font-mono">Administration Instructions</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Welcome to the Firebase-powered unified administration control panel. Any changes made here (publishing events, managing staff profiles, updating layout configuration, or approving admin access) sync instantly with the public pages. Use the sidebar tabs to navigate individual modules.
                </p>
              </div>
            </div>
          )}

          {/* 2. EVENT CRUD VIEW */}
          {activeTab === 'events' && (
            <div className="space-y-8" id="view-events">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Events Roster Table</h2>
                <button
                  id="add-new-event-btn"
                  onClick={() => { setEditingEventId(''); setEventForm({ status: 'Upcoming' }); }}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Publish New Event
                </button>
              </div>

              {editingEventId !== null ? (
                <form onSubmit={saveEvent} className="space-y-4" id="event-editor-form">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">
                    {editingEventId === '' ? 'Create New Event' : `Edit Event: ${editingEventId}`}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Event Title *</label>
                      <input
                        type="text"
                        required
                        value={eventForm.title || ''}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Event Status *</label>
                      <select
                        value={eventForm.status || 'Upcoming'}
                        onChange={(e: any) => setEventForm({ ...eventForm, status: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={eventForm.description || ''}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Venue *</label>
                      <input
                        type="text"
                        required
                        value={eventForm.venue || ''}
                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Date *</label>
                      <input
                        type="date"
                        required
                        value={eventForm.date || ''}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 09:30 AM"
                        value={eventForm.time || ''}
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Speaker / Guest Panel</label>
                      <input
                        type="text"
                        value={eventForm.speaker || ''}
                        onChange={(e) => setEventForm({ ...eventForm, speaker: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Banner Image URL (Paste ImgBB Direct Link) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. https://i.ibb.co/..."
                        value={eventForm.banner || ''}
                        onChange={(e) => setEventForm({ ...eventForm, banner: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                      <ImagePreview url={eventForm.banner || ''} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Google Form Registration URL</label>
                      <input
                        type="url"
                        value={eventForm.registration_link || ''}
                        onChange={(e) => setEventForm({ ...eventForm, registration_link: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Google Drive Certificate Folder URL</label>
                      <input
                        type="url"
                        value={eventForm.certificate_link || ''}
                        onChange={(e) => setEventForm({ ...eventForm, certificate_link: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => { setEditingEventId(null); setEventForm({}); }}
                      className="px-4 py-2 border border-neutral-850 hover:border-neutral-700 bg-black text-neutral-400 hover:text-white rounded-lg text-xs font-mono focus:outline-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1 focus:outline-none cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Event
                    </button>
                  </div>
                </form>
              ) : (
                <div className="overflow-x-auto" id="events-table-wrapper">
                  {events.length === 0 ? (
                    <div className="py-12 text-center text-xs font-mono text-neutral-500 bg-black border border-neutral-900 rounded-lg">
                      No events available at the moment.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-neutral-400" id="events-dashboard-table">
                      <thead>
                        <tr className="border-b border-neutral-900 font-mono text-neutral-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Event Banner / Title</th>
                          <th className="py-3 px-4">Venue & Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(ev => (
                          <tr key={ev.id} className="border-b border-neutral-950 hover:bg-neutral-950/20" id={`table-row-event-${ev.id}`}>
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
                                  onClick={() => { setEditingEventId(ev.id); setEventForm(ev); }}
                                  className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`delete-event-btn-${ev.id}`}
                                  onClick={() => deleteEvent(ev.id)}
                                  className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-500 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. COMMITTEE (EXECOM) CRUD VIEW */}
          {activeTab === 'committee' && (
            <div className="space-y-8" id="view-committee">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Roster Management Table</h2>
                <button
                  id="add-new-member-btn"
                  onClick={() => { setEditingMemberId(''); setMemberForm({ display_order: 99 }); }}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Staff / Member
                </button>
              </div>

              {editingMemberId !== null ? (
                <form onSubmit={saveMember} className="space-y-4" id="member-editor-form">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">
                    {editingMemberId === '' ? 'Add Leader Record' : `Modify Leader: ${editingMemberId}`}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={memberForm.name || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Designation / Role *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chairman / Tech Lead"
                        value={memberForm.position || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Short Bio *</label>
                    <textarea
                      required
                      rows={3}
                      value={memberForm.bio || ''}
                      onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                      className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Profile Display Order Index *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 1 for Top, 99 for Standard"
                        value={memberForm.display_order ?? ''}
                        onChange={(e) => setMemberForm({ ...memberForm, display_order: Number(e.target.value) })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Profile Image URL (Paste ImgBB Direct Link) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. https://i.ibb.co/..."
                        value={memberForm.image || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, image: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none font-mono"
                      />
                      <ImagePreview url={memberForm.image || ''} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">LinkedIn Link</label>
                      <input
                        type="url"
                        value={memberForm.linkedin || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, linkedin: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">GitHub Link</label>
                      <input
                        type="url"
                        value={memberForm.github || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, github: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Instagram Link</label>
                      <input
                        type="url"
                        value={memberForm.instagram || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, instagram: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-neutral-400">Email Address</label>
                      <input
                        type="email"
                        value={memberForm.email || ''}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => { setEditingMemberId(null); setMemberForm({}); }}
                      className="px-4 py-2 border border-neutral-850 hover:border-neutral-700 bg-black text-neutral-400 hover:text-white rounded-lg text-xs font-mono focus:outline-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1 focus:outline-none cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Record
                    </button>
                  </div>
                </form>
              ) : (
                <div className="overflow-x-auto" id="members-table-wrapper">
                  {members.length === 0 ? (
                    <div className="py-12 text-center text-xs font-mono text-neutral-500 bg-black border border-neutral-900 rounded-lg">
                      Execom members will be updated soon.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-neutral-400" id="members-dashboard-table">
                      <thead>
                        <tr className="border-b border-neutral-900 font-mono text-neutral-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Profile Avatar / Name</th>
                          <th className="py-3 px-4">Position</th>
                          <th className="py-3 px-4">Order Index</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(m => (
                          <tr key={m.id} className="border-b border-neutral-950 hover:bg-neutral-950/20" id={`table-row-member-${m.id}`}>
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
                                  className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`delete-member-btn-${m.id}`}
                                  onClick={() => deleteMember(m.id)}
                                  className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-500 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. GALLERY CRUD VIEW */}
          {activeTab === 'gallery' && (
            <div className="space-y-8" id="view-gallery">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Publish Photographs</h2>
              
              <form onSubmit={addGalleryItem} className="bg-black border border-neutral-900 p-5 rounded-lg space-y-4" id="gallery-uploader-form">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">Append New Image</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select target album */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-500">Associate with Event Album *</label>
                    <select
                      value={galleryForm.event_id || 'all'}
                      onChange={(e) => setGalleryForm({ ...galleryForm, event_id: e.target.value })}
                      className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="all">General Club Activities</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Image URL Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-500">Direct Image URL (Paste ImgBB Direct Link) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. https://i.ibb.co/..."
                      value={galleryForm.image_url || ''}
                      onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                      className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none"
                    />
                    <ImagePreview url={galleryForm.image_url || ''} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-500">Caption *</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of this specific event photograph..."
                    value={galleryForm.caption || ''}
                    onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                    className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  id="submit-gallery-btn"
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Publish Photograph
                </button>
              </form>

              {/* Grid of gallery items */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">Live Photographs Grid</h3>
                {gallery.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-neutral-500 bg-black border border-neutral-900 rounded-lg">
                    No gallery images available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="gallery-editor-grid">
                    {gallery.map(img => (
                      <div key={img.id} className="bg-black border border-neutral-900 p-2.5 rounded-lg flex flex-col justify-between" id={`gallery-row-${img.id}`}>
                        <div className="aspect-[4/3] rounded overflow-hidden bg-neutral-950 mb-2">
                          <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-neutral-500 text-[10px] font-mono uppercase truncate">
                            Album: {events.find(e => e.id === img.event_id)?.title || 'General'}
                          </p>
                          <p className="text-white text-xs line-clamp-2 leading-relaxed">{img.caption}</p>
                          <button
                            id={`delete-gallery-btn-${img.id}`}
                            onClick={() => deleteGalleryItem(img.id)}
                            className="w-full mt-2 py-1 bg-neutral-950 hover:bg-red-950/20 text-neutral-500 hover:text-red-400 border border-neutral-900 hover:border-red-900/30 rounded text-[10px] font-mono flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove Picture
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. WEBSITE LAYOUT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8" id="view-settings">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Website Settings Manager</h2>
              
              {/* Hero Section Config */}
              <div className="bg-black border border-neutral-900 p-5 rounded-lg space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">Hero Landing Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Main Title Text</label>
                    <input
                      id="input-hero-text"
                      type="text"
                      defaultValue={settings.heroText}
                      className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Sub-heading Label</label>
                    <input
                      id="input-hero-subtext"
                      type="text"
                      defaultValue={settings.heroSubtext}
                      className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400">Mission Description Tagline</label>
                  <textarea
                    id="input-hero-tagline"
                    rows={2}
                    defaultValue={settings.heroTagline}
                    className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
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
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Hero layout
                </button>
              </div>

              {/* Statistics settings */}
              <div className="bg-black border border-neutral-900 p-5 rounded-lg space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">Metric Stat Counter Numbers</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Members</label>
                    <input id="input-stat-members" type="number" defaultValue={settings.statistics?.members ?? 240} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Events</label>
                    <input id="input-stat-events" type="number" defaultValue={settings.statistics?.events ?? 28} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Hackathons</label>
                    <input id="input-stat-hacks" type="number" defaultValue={settings.statistics?.hackathons ?? 5} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Projects</label>
                    <input id="input-stat-projects" type="number" defaultValue={settings.statistics?.projects ?? 12} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Years Active</label>
                    <input id="input-stat-years" type="number" defaultValue={settings.statistics?.yearsActive ?? 5} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
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
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Statistics
                </button>
              </div>

              {/* Contact config */}
              <div className="bg-black border border-neutral-900 p-5 rounded-lg space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-500">Institutional Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Email Address</label>
                    <input id="input-link-email" type="email" defaultValue={settings.socialLinks?.email} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">Instagram URL</label>
                    <input id="input-link-insta" type="url" defaultValue={settings.socialLinks?.instagram} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">LinkedIn URL</label>
                    <input id="input-link-linkd" type="url" defaultValue={settings.socialLinks?.linkedin} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-neutral-400">GitHub Organization URL</label>
                    <input id="input-link-githb" type="url" defaultValue={settings.socialLinks?.github} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400">Embedded Google Map Embed URL (Src)</label>
                  <input id="input-link-map" type="text" defaultValue={settings.socialLinks?.mapEmbedUrl} className="w-full bg-black border border-neutral-850 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:outline-none" />
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
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs font-mono rounded-lg flex items-center gap-1 focus:outline-none cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Socials
                </button>
              </div>
            </div>
          )}

          {/* 6. ACCESS REQUESTS MANAGEMENT VIEW */}
          {activeTab === 'requests' && (
            <div className="space-y-6" id="view-requests">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-900 pb-4 gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Access Approval Queue</h2>
                  <p className="text-neutral-500 text-[10px]">Verify identity and grant administrative credentials to pending requests.</p>
                </div>
                <div className="flex gap-1.5 bg-neutral-900/60 p-1 border border-neutral-850 rounded-lg">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setRequestFilter(f)}
                      className={`px-3 py-1 text-[10px] font-mono rounded cursor-pointer ${
                        requestFilter === f ? 'bg-orange-600 text-black font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {!isSuperAdmin && (
                <div className="p-4 bg-zinc-950 border border-neutral-900 rounded-xl text-neutral-400 text-xs flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>Administrative Notice: Standard admins can only view requests. Only a <b>Super Admin</b> holds approval permissions.</span>
                </div>
              )}

              <div className="space-y-4">
                {requestsList
                  .filter(r => requestFilter === 'all' || r.status === requestFilter)
                  .length === 0 ? (
                    <div className="py-12 text-center text-xs font-mono text-neutral-500 bg-black border border-neutral-900 rounded-lg">
                      No pending admin access requests.
                    </div>
                  ) : (
                    requestsList
                      .filter(r => requestFilter === 'all' || r.status === requestFilter)
                      .map(req => {
                        const isPending = req.status === 'pending';
                        const isApproved = req.status === 'approved';
                        const isRejected = req.status === 'rejected';

                        return (
                          <div 
                            key={req.uid} 
                            className={`p-5 rounded-xl border bg-black/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                              isPending ? 'border-orange-500/20 shadow-[0_0_20px_rgba(255,107,0,0.02)]' : 'border-neutral-900'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white font-mono">{req.displayName}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                                  isPending ? 'bg-orange-600/10 text-orange-500 border border-orange-500/20' :
                                  isApproved ? 'bg-green-600/10 text-green-400 border border-green-500/20' :
                                  'bg-red-600/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {req.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-neutral-400 text-xs font-mono">{req.email}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-500 font-mono">
                                <span>Requested: {formatTimestamp(req.firstRequestedAt)}</span>
                                <span>Attempts: {req.attemptCount}</span>
                                <span>Last attempt: {formatTimeOnly(req.lastAttemptAt)}</span>
                              </div>
                              {isRejected && req.rejectionReason && (
                                <p className="text-red-400/90 text-xs font-mono border-t border-neutral-900 pt-1.5 mt-1.5">
                                  Rejection Reason: {req.rejectionReason}
                                </p>
                              )}
                              {!isPending && req.reviewedBy && (
                                <p className="text-neutral-500 text-[10px] font-mono">
                                  Reviewed by: {req.reviewedBy} on {formatTimestamp(req.reviewedAt)}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons for Super Admin */}
                            {isSuperAdmin && isPending && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="px-3.5 py-2 bg-green-600 hover:bg-green-500 text-black font-extrabold text-xs font-mono rounded-lg flex items-center gap-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-red-400 hover:text-red-300 font-bold text-xs font-mono rounded-lg flex items-center gap-1 cursor-pointer"
                                >
                                  <UserX className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
              </div>
            </div>
          )}

          {/* 7. ADMINISTRATORS LIST VIEW */}
          {activeTab === 'admins' && (
            <div className="space-y-6" id="view-admins">
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Authorized Administrators</h2>
                <p className="text-neutral-500 text-[10px] mt-1">Manage active credentials, alter roles, and suspend administrator privileges.</p>
              </div>

              {!isSuperAdmin && (
                <div className="p-4 bg-zinc-950 border border-neutral-900 rounded-xl text-neutral-400 text-xs flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>Administrative Notice: Only the <b>Super Administrator</b> role holds privileges to disable, promote, or remove admin accounts.</span>
                </div>
              )}

              <div className="space-y-4">
                {adminsList.map(adm => {
                  const isSelf = adm.uid === user?.uid;
                  const isActive = adm.status === 'active';
                  const isSuper = adm.role === 'super_admin';

                  return (
                    <div 
                      key={adm.uid} 
                      className={`p-5 rounded-xl border bg-black/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isSelf ? 'border-orange-500/20 shadow-[0_0_20px_rgba(255,107,0,0.02)]' : 'border-neutral-900'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white font-mono">
                            {adm.displayName} {isSelf && <span className="text-orange-500 font-extrabold">(YOU)</span>}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                            isSuper ? 'bg-orange-600/10 text-orange-500 border-orange-500/20' : 'bg-neutral-800 text-neutral-300 border-neutral-750'
                          }`}>
                            {isSuper ? 'SUPER ADMIN' : 'ADMIN'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                            isActive ? 'bg-green-600/10 text-green-400 border border-green-500/20' : 'bg-neutral-800 text-neutral-500 border border-neutral-850'
                          }`}>
                            {adm.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-xs font-mono">{adm.email}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-500 font-mono">
                          <span>Approved: {formatTimestamp(adm.approvedAt)}</span>
                          <span>By: {adm.approvedBy}</span>
                        </div>
                      </div>

                      {/* Administrative management controls (Super Admin only, blocking actions on self) */}
                      {isSuperAdmin && !isSelf && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleChangeRole(adm, isSuper ? 'admin' : 'super_admin')}
                            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] font-mono rounded hover:text-white cursor-pointer"
                          >
                            Set as {isSuper ? 'Admin' : 'Super Admin'}
                          </button>
                          
                          <button
                            onClick={() => handleToggleAdminStatus(adm)}
                            className={`px-3 py-1.5 border text-[10px] font-mono rounded cursor-pointer ${
                              isActive 
                                ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-orange-500' 
                                : 'bg-green-600/10 border-green-500/25 text-green-400'
                            }`}
                          >
                            {isActive ? 'Disable Access' : 'Enable Access'}
                          </button>
                          
                          <button
                            onClick={() => handleRemoveAdminAccess(adm)}
                            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-red-500 hover:text-red-400 text-[10px] font-mono rounded cursor-pointer"
                          >
                            Remove Credentials
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. AUDIT LOGS VIEW */}
          {activeTab === 'activity' && (
            <div className="space-y-6" id="view-activity">
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Administrative Activity Logs</h2>
                <p className="text-neutral-500 text-[10px] mt-1">Audit log records of operations performed by platform managers.</p>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {auditLogs.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-neutral-500 bg-black border border-neutral-900 rounded-lg">
                    No administrative activity recorded yet.
                  </div>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="p-3.5 bg-black/60 border border-neutral-900 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-orange-500 font-mono tracking-tight">{log.action.toUpperCase()}</span>
                        <span className="text-[10px] text-neutral-600 font-mono">
                          {log.timestamp?.seconds 
                            ? new Date(log.timestamp.seconds * 1000).toLocaleString() 
                            : log.timestamp 
                              ? new Date(log.timestamp).toLocaleString()
                              : 'Just now'
                          }
                        </span>
                      </div>
                      <p className="text-neutral-300">
                        Target: <span className="font-mono text-white">{log.targetName}</span> ({log.targetType})
                      </p>
                      <p className="text-neutral-500 text-[10px] font-mono">
                        By: {log.performedByEmail} ({log.performedByUid})
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 9. DATABASE BACKUP AND RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-8" id="view-backup">
              <h2 className="text-base font-bold font-mono text-white border-l-4 border-orange-500 pl-3">Database Protection</h2>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Curate backups of events, gallery assets, and committee profiles locally. This allows you to restore configurations or roll back content changes in seconds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Export Card */}
                <div className="bg-black border border-neutral-900 rounded-lg p-6 space-y-4 flex flex-col justify-between" id="backup-export-card">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white font-mono">1. Export Entire Database</h3>
                    <p className="text-neutral-500 text-xs">Downloads a single, structured `.json` backup file containing your events roster, staff profiles, gallery albums, and settings parameters.</p>
                  </div>
                  <button
                    id="export-db-btn"
                    onClick={handleExportDb}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs font-mono rounded border border-neutral-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-orange-500" /> Export Database JSON
                  </button>
                </div>

                {/* Import Card */}
                <div className="bg-black border border-neutral-900 rounded-lg p-6 space-y-4 flex flex-col justify-between" id="backup-import-card">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white font-mono">2. Restore Database Backup</h3>
                    <p className="text-neutral-500 text-xs">Restore all content elements. This will overwrite current Firestore entries with records specified in the backup.</p>
                  </div>
                  <label className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs font-mono rounded border border-neutral-800 flex items-center justify-center gap-1.5 cursor-pointer transition-all">
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
