import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeView from './components/HomeView';
import EventsView from './components/EventsView';
import AboutView from './components/AboutView';
import GalleryView from './components/GalleryView';
import ContactView from './components/ContactView';
import AdminView from './components/AdminView';
import { Event, Member, GalleryItem, Settings } from './types';
import { Terminal } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from './services/firebase';

function MainApp() {
  const { user, isAuthorizedAdmin, accessRequest, loading: authLoading, logout, loginWithGoogle } = useAuth();
  
  // Custom SPA Router Path State
  const [path, setPath] = useState<string>(window.location.pathname);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core database states populated in real-time from Firestore
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Shared UX states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Sync window.location.pathname with state
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Settings Listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      } else {
        // Fallback default settings for empty database
        setSettings({
          heroText: "CSE SBCE Coding Club",
          heroSubtext: "Sree Buddha College of Engineering, Pattoor",
          heroTagline: "Empowering the next generation of developers and software architects through collaborative hacking, hands-on bootcamps, and engineering excellence.",
          aboutHistory: "Established in 2021 by the Department of Computer Science & Engineering, the SBCE Coding Club has grown into the campus hub for technological leadership.",
          aboutMission: "To nurture a robust and inclusive developer ecosystem on campus where students learn modern engineering practices by doing.",
          aboutVision: "To produce top-tier technical talent capable of engineering solutions for national and global challenges, setting a benchmark for student-run technical communities in Kerala.",
          aboutObjectives: [
            "Conduct weekly code-along labs and specialized bootcamps on industry-relevant frameworks."
          ],
          aboutCoordinators: [
            { name: "Dr. Saji V.R.", title: "HOD, CSE Dept" }
          ],
          statistics: {
            members: 240,
            events: 28,
            hackathons: 5,
            projects: 12,
            yearsActive: 5
          },
          socialLinks: {
            email: "codingclub@sbce.ac.in",
            instagram: "https://instagram.com/sbce_codingclub",
            linkedin: "https://linkedin.com/company/sbce-codingclub",
            github: "https://github.com/sbce-codingclub",
            location: "Sree Buddha College of Engineering, Pattoor, Nooranad, Alappuzha, Kerala - 690529",
            mapEmbedUrl: ""
          },
          footerText: "© 2026 CSE SBCE Coding Club. Engineered for developers, by developers."
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching settings from Firestore:', err);
      setIsLoading(false);
    });

    // 2. Events Listener
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventsList: Event[] = [];
      snapshot.forEach((d) => {
        eventsList.push({ id: d.id, ...d.data() } as Event);
      });
      setEvents(eventsList);
    });

    // 3. Execom Members Listener
    const unsubMembers = onSnapshot(collection(db, 'execom'), (snapshot) => {
      const membersList: Member[] = [];
      snapshot.forEach((d) => {
        membersList.push({ id: d.id, ...d.data() } as Member);
      });
      membersList.sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
      setMembers(membersList);
    });

    // 4. Gallery Listener
    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const galleryList: GalleryItem[] = [];
      snapshot.forEach((d) => {
        galleryList.push({ id: d.id, ...d.data() } as GalleryItem);
      });
      setGallery(galleryList);
    });

    return () => {
      unsubSettings();
      unsubEvents();
      unsubMembers();
      unsubGallery();
    };
  }, []);

  // Map route path to App tabs
  let currentTab = 'home';
  if (path === '/events') {
    currentTab = 'events';
  } else if (path === '/about' || path === '/execom') {
    currentTab = 'about';
  } else if (path === '/gallery') {
    currentTab = 'gallery';
  } else if (path === '/contact') {
    currentTab = 'contact';
  } else if (path.startsWith('/admin')) {
    currentTab = 'admin';
  }

  // Handle Tab transitions in Header via URLs
  const handleSetTab = (tabId: string) => {
    if (tabId === 'home') {
      navigate('/');
    } else if (tabId === 'about') {
      navigate('/about');
    } else {
      navigate(`/${tabId}`);
    }
  };

  const handleSelectEventFromHome = (evt: Event) => {
    setSelectedEvent(evt);
    navigate('/events');
  };

  // Auth Protection / Redirect Guard
  useEffect(() => {
    if (authLoading) return;

    if (path.startsWith('/admin')) {
      if (!user) {
        // Not logged in -> force login page
        if (path !== '/admin/login') {
          navigate('/admin/login');
        }
      } else {
        if (!isAuthorizedAdmin) {
          // Logged in but not approved -> force access-pending page
          if (path !== '/admin/access-pending') {
            navigate('/admin/access-pending');
          }
        } else {
          // Logged in & approved -> prevent login/pending views, force dashboard
          if (path === '/admin/login' || path === '/admin/access-pending' || path === '/admin') {
            navigate('/admin/dashboard');
          }
        }
      }
    }
  }, [user, isAuthorizedAdmin, path, authLoading]);

  // Loading Skeletons Fallback
  if (isLoading || authLoading || !settings) {
    return (
      <div className="min-h-screen bg-black text-neutral-500 flex flex-col items-center justify-center p-6 select-none font-mono text-sm" id="loading-fallback">
        <div className="space-y-4 max-w-sm w-full text-center">
          <Terminal className="w-8 h-8 text-orange-500 mx-auto animate-pulse" />
          <div className="space-y-2">
            <p className="text-white font-bold tracking-tight">sbce-coding-club:~# boot --full-stack</p>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden relative">
              <div className="bg-orange-500 h-full rounded-full animate-[shimmer_2s_infinite]" style={{ width: '65%' }}></div>
            </div>
            <p className="text-[10px] text-neutral-600">Connecting to Firebase Cloud Engine...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render Access Pending Page
  const renderAccessPendingPage = () => {
    const isRejected = accessRequest?.status === 'rejected';
    
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12" id="admin-pending-container">
        <div className="w-full max-w-md bg-black/60 backdrop-blur-md border border-neutral-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,107,0,0.05)] text-center space-y-6 relative overflow-hidden" id="pending-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-14 h-14 bg-neutral-900 border border-neutral-850 rounded-full flex items-center justify-center text-orange-500 mx-auto shadow-lg">
            <Terminal className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-mono text-white">Access Verification</h1>
            <p className="text-neutral-500 text-xs">Signed-in as: <span className="text-neutral-300 font-mono">{user?.email}</span></p>
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
                : "Your account does not currently have administrator access. Your access request has been recorded and can be reviewed by an existing administrator."
              }
            </p>
          </div>

          <button
            id="pending-logout-btn"
            onClick={logout}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-semibold text-xs font-mono rounded-xl transition-all cursor-pointer"
          >
            Sign Out & Logout
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-orange-500 selection:text-black font-sans" id="app-root">

      {/* Navigation Header */}
      <Header 
        currentTab={currentTab} 
        setTab={handleSetTab} 
        isAuthenticated={isAuthorizedAdmin} 
        onLogout={logout} 
      />

      {/* Main View rendering based on current tab */}
      {currentTab === 'home' && (
        <HomeView 
          settings={settings} 
          events={events} 
          members={members} 
          setTab={handleSetTab} 
          onSelectEvent={handleSelectEventFromHome} 
        />
      )}

      {currentTab !== 'home' && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24" id="constrained-layout">
          <main id="main-content-area">
            {currentTab === 'events' && (
              <EventsView 
                events={events} 
                onSelectEvent={setSelectedEvent} 
                selectedEvent={selectedEvent} 
                onCloseModal={() => setSelectedEvent(null)} 
              />
            )}

            {currentTab === 'about' && (
              <AboutView 
                settings={settings} 
                members={members} 
              />
            )}

            {currentTab === 'gallery' && (
              <GalleryView 
                gallery={gallery} 
                events={events} 
              />
            )}

            {currentTab === 'contact' && (
              <ContactView 
                settings={settings} 
              />
            )}

            {currentTab === 'admin' && (
                <AdminView 
                  isAuthenticated={isAuthorizedAdmin} 
                  onLogin={loginWithGoogle}
                  currentUser={user}
                  accessRequest={accessRequest}
                  onLogout={logout}
                  events={events} 
                  members={members} 
                  gallery={gallery} 
                  settings={settings} 
                  onUpdateEvents={setEvents} 
                  onUpdateMembers={setMembers} 
                  onUpdateGallery={setGallery} 
                  onUpdateSettings={setSettings} 
                  token="" 
                  path={path}
                  navigate={navigate}
                />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
