import React, { useState } from 'react';
import { Search, Filter, Calendar, MapPin, User, ArrowRight, Download, Info, ExternalLink } from 'lucide-react';
import { Event } from '../types';

interface EventsViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  selectedEvent: Event | null;
  onCloseModal: () => void;
}

type EventFilterType = 'All' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Workshops' | 'Hackathons' | 'Bootcamps' | 'Competitions' | 'Talks';

export default function EventsView({ events, onSelectEvent, selectedEvent, onCloseModal }: EventsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventFilterType>('All');

  // Derive categories from tags or titles
  const matchesCategory = (evt: Event, filter: EventFilterType) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return evt.status === 'Upcoming';
    if (filter === 'Ongoing') return evt.status === 'Ongoing';
    if (filter === 'Completed') return evt.status === 'Completed';

    const titleLower = evt.title.toLowerCase();
    const descLower = evt.description.toLowerCase();

    if (filter === 'Workshops') {
      return titleLower.includes('workshop') || descLower.includes('workshop') || titleLower.includes('bootcamp') || titleLower.includes('course');
    }
    if (filter === 'Hackathons') {
      return titleLower.includes('hackathon') || titleLower.includes('hack') || titleLower.includes('fest');
    }
    if (filter === 'Bootcamps') {
      return titleLower.includes('bootcamp') || titleLower.includes('camp');
    }
    if (filter === 'Competitions') {
      return titleLower.includes('competition') || titleLower.includes('contest') || titleLower.includes('challenge');
    }
    if (filter === 'Talks') {
      return titleLower.includes('talk') || titleLower.includes('speaker') || titleLower.includes('seminar') || titleLower.includes('intro');
    }
    return true;
  };

  const filteredEvents = events.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.speaker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = matchesCategory(evt, activeFilter);
    return matchesSearch && matchesCat;
  });

  const filterOptions: EventFilterType[] = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Workshops', 'Hackathons', 'Bootcamps', 'Competitions', 'Talks'];

  return (
    <div className="space-y-12 pb-20" id="events-view">
      {/* Page Header */}
      <div className="space-y-4 max-w-2xl" id="events-header">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-mono border-l-4 border-orange-500 pl-4">
          Events Directory
        </h1>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          Browse our calendar of code-along sessions, national sprint hackathons, algorithmic bootcamps, and developer panel seminars.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.3)]"
        id="events-filter-bar"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            id="event-search-input"
            type="text"
            placeholder="Search titles, speakers, descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 backdrop-blur-sm focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Filter Indicator */}
        <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs">
          <Filter className="w-3.5 h-3.5" />
          <span>Active Filter: <b className="text-orange-500">{activeFilter}</b></span>
        </div>
      </div>

      {/* Tabs Filter Row */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none" id="events-filter-tags">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            id={`filter-opt-${opt}`}
            onClick={() => setActiveFilter(opt)}
            className={`px-4 py-1.5 text-xs font-mono font-medium rounded-full border backdrop-blur-sm transition-all shrink-0 focus:outline-none ${activeFilter === opt
              ? 'border-orange-500/60 text-orange-400 bg-orange-500/10 shadow-[0_0_14px_rgba(255,107,0,0.15)]'
              : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Events Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="events-grid">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => {
            const isCompleted = evt.status === 'Completed';
            const isUpcoming = evt.status === 'Upcoming';
            const isOngoing = evt.status === 'Ongoing';

            return (
              <div
                key={evt.id}
                id={`event-card-${evt.id}`}
                className="
                  group relative flex flex-col justify-between h-[520px] overflow-hidden
                  bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl
                  shadow-[0_8px_32px_rgba(0,0,0,0.35)]
                  transition-all duration-500 ease-out
                  hover:-translate-y-1.5 hover:border-orange-500/30
                  hover:shadow-[0_24px_55px_rgba(0,0,0,0.5),0_0_40px_rgba(255,107,0,0.12)]
                "
              >

                {/* Ambient glow wash on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(120%_50%_at_50%_0%,rgba(255,107,0,0.10),transparent_70%)]" />

                {/* Image Section */}
                <div className="aspect-video relative overflow-hidden bg-neutral-950">
                  <img
                    src={evt.banner}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* Bottom gradient for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                  {/* Diagonal shine sweep */}
                  <div
                    className="
                      absolute top-0 -left-full w-1/2 h-full
                      bg-gradient-to-r from-transparent via-white/20 to-transparent
                      skew-x-[-20deg] group-hover:left-[150%]
                      transition-[left] duration-1000 ease-out
                    "
                  />
                  {/* Status Badge */}
                  <span
                    className={`absolute top-4 right-4 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono rounded-full backdrop-blur-md flex items-center gap-1.5 ${isCompleted
                      ? 'bg-black/50 text-neutral-400 border border-white/15'
                      : isOngoing
                        ? 'bg-black/50 text-orange-400 border border-orange-500/40 shadow-[0_0_14px_rgba(255,107,0,0.2)]'
                        : 'bg-white/90 text-black border border-white'
                      }`}
                  >
                    {!isCompleted && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${isOngoing ? 'bg-orange-400' : 'bg-black'}`} />
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isOngoing ? 'bg-orange-400' : 'bg-black'}`} />
                      </span>
                    )}
                    {evt.status}
                  </span>
                </div>

                {/* Details Section */}
                <div className="relative p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-orange-500/70" />
                        {evt.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-500/70" />
                        {evt.venue}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-mono leading-tight group-hover:text-orange-400 transition-colors duration-300 line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-neutral-400 text-xs leading-relaxed line-clamp-3">
                      {evt.description}
                    </p>

                    <div className="flex items-center gap-2 pt-2 text-[11px] text-neutral-400 font-mono bg-white/[0.03] p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="line-clamp-1">Speaker: <b className="text-white">{evt.speaker || 'TBD'}</b></span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-12 gap-2 pt-4 border-t border-white/10 mt-4">
                    <button
                      id={`event-details-btn-${evt.id}`}
                      onClick={() => onSelectEvent(evt)}
                      className="
                        col-span-3 p-2 rounded-xl border transition-all text-xs flex items-center justify-center gap-1 focus:outline-none
                        bg-white/[0.04] border-white/10 text-neutral-400 backdrop-blur-sm
                        hover:bg-white/10 hover:border-white/25 hover:text-white hover:-translate-y-0.5
                      "
                      title="View Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {isCompleted ? (
                      <a
                        href={evt.certificate_link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!evt.certificate_link) {
                            e.preventDefault();
                            alert("Certificate link has not been configured by Admin yet.");
                          }
                        }}
                        className={`col-span-9 py-2 px-3 rounded-xl font-mono text-xs font-bold text-center flex items-center justify-center gap-2 border backdrop-blur-sm transition-all ${evt.certificate_link
                            ? 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15 hover:border-white/30 hover:-translate-y-0.5'
                            : 'bg-white/[0.02] text-neutral-600 border-white/5 cursor-not-allowed'
                          }`}
                        id={`event-cert-btn-${evt.id}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Certificates
                      </a>
                    ) : (
                      <a
                        href={evt.registration_link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!evt.registration_link) {
                            e.preventDefault();
                            alert("Registration link has not been set by Admin yet.");
                          }
                        }}
                        className={`col-span-9 py-2 px-3 rounded-xl font-mono text-xs font-bold text-center flex items-center justify-center gap-2 transition-all ${evt.registration_link
                            ? 'bg-orange-600 hover:bg-orange-500 text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] hover:shadow-[0_0_28px_rgba(255,107,0,0.4)] hover:-translate-y-0.5'
                            : 'bg-white/[0.02] text-neutral-600 border border-white/5 cursor-not-allowed'
                          }`}
                        id={`event-reg-btn-${evt.id}`}
                      >
                        Register
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 border border-dashed border-white/10 rounded-2xl p-12 text-center text-neutral-500 font-mono text-sm bg-white/[0.02] backdrop-blur-sm">
            No events match your current filter criteria or search. Try updating your terms!
          </div>
        )}
      </div>

      {/* Detailed Modal/Drawer overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="event-detail-modal">
          <div className="w-full max-w-2xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="aspect-video relative bg-neutral-950 border-b border-white/10">
              <img src={selectedEvent.banner} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <button
                id="close-modal-btn"
                onClick={onCloseModal}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full border border-white/15 backdrop-blur-md transition-colors focus:outline-none"
              >
                ✕
              </button>
              <span className="absolute bottom-4 left-4 px-2.5 py-1 bg-orange-600 text-black text-xs font-bold uppercase tracking-wider font-mono rounded-full shadow-[0_0_16px_rgba(255,107,0,0.35)]">
                {selectedEvent.status}
              </span>
            </div>

            {/* Scrollable details container */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4 text-xs font-mono text-neutral-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-500" /> {selectedEvent.date} ({selectedEvent.time})</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" /> {selectedEvent.venue}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">{selectedEvent.title}</h2>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block">Speaker / Host Panel</span>
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{selectedEvent.speaker || 'To Be Announced'}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">Invited Technical Expert</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block">Syllabus & Activity Roadmap</span>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">{selectedEvent.description}</p>
              </div>

              {/* CTAs */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  id="modal-cancel-btn"
                  onClick={onCloseModal}
                  className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                >
                  Close
                </button>

                {selectedEvent.status === 'Completed' ? (
                  <a
                    href={selectedEvent.certificate_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!selectedEvent.certificate_link) {
                        e.preventDefault();
                        alert("Certificate folder has not been added yet.");
                      }
                    }}
                    className={`px-5 py-2.5 font-mono text-xs font-bold rounded-xl flex items-center gap-2 border transition-all ${selectedEvent.certificate_link
                      ? 'bg-orange-600 hover:bg-orange-500 text-black shadow-[0_0_20px_rgba(255,107,0,0.25)]'
                      : 'bg-white/[0.02] text-neutral-600 border-white/5 cursor-not-allowed'
                      }`}
                    id="modal-certificate-link"
                  >
                    <Download className="w-4 h-4" />
                    Download Certificates
                  </a>
                ) : (
                  <a
                    href={selectedEvent.registration_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!selectedEvent.registration_link) {
                        e.preventDefault();
                        alert("Registration form link has not been setup yet.");
                      }
                    }}
                    className={`px-5 py-2.5 font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${selectedEvent.registration_link
                      ? 'bg-orange-600 hover:bg-orange-500 text-black shadow-[0_0_20px_rgba(255,107,0,0.25)]'
                      : 'bg-white/[0.02] text-neutral-600 border border-white/5 cursor-not-allowed'
                      }`}
                    id="modal-registration-link"
                  >
                    Complete Form Registration
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
