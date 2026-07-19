import React, { useState } from 'react';
import { Image, ChevronLeft, ChevronRight, Maximize2, Layers } from 'lucide-react';
import { GalleryItem, Event } from '../types';

interface GalleryViewProps {
  gallery: GalleryItem[];
  events: Event[];
}

export default function GalleryView({ gallery, events }: GalleryViewProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter gallery items by album/event
  const filteredGallery = gallery.filter(item => {
    if (selectedAlbum === 'all') return true;
    return item.event_id === selectedAlbum;
  });

  // Get event title by event_id for labels
  const getEventTitle = (eventId: string) => {
    if (eventId === 'all' || eventId === 'general') return 'General Club Activities';
    const evt = events.find(e => e.id === eventId);
    return evt ? evt.title : 'Club Milestones';
  };

  // Lightbox Navigation
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : filteredGallery.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-12 pb-20" id="gallery-view">
      {/* 4.5 Header */}
      <div className="space-y-4 max-w-2xl" id="gallery-header">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-mono border-l-4 border-orange-500 pl-4">
          Photo Gallery
        </h1>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          Glimpse into our workshops, brainstorming huddles, inauguration assemblies, and collaborative team sprints.
        </p>
      </div>

      {/* Album Filters / Selector */}
      <div
        className="flex flex-wrap items-center gap-3 bg-white/[0.03] border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.3)]"
        id="gallery-albums-bar"
      >
        <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs pr-4 border-r border-white/10 shrink-0">
          <Layers className="w-4 h-4 text-orange-500" />
          <span>Select Album:</span>
        </div>

        <button
          onClick={() => setSelectedAlbum('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium backdrop-blur-sm transition-all focus:outline-none ${
            selectedAlbum === 'all'
              ? 'bg-orange-600 text-black font-bold shadow-[0_0_16px_rgba(255,107,0,0.3)]'
              : 'bg-white/[0.02] border border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
          }`}
          id="album-btn-all"
        >
          All Activities
        </button>

        {events.map(evt => (
          <button
            key={evt.id}
            id={`album-btn-${evt.id}`}
            onClick={() => setSelectedAlbum(evt.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium backdrop-blur-sm transition-all shrink-0 max-w-[200px] truncate focus:outline-none ${
              selectedAlbum === evt.id
                ? 'bg-orange-600 text-black font-bold shadow-[0_0_16px_rgba(255,107,0,0.3)]'
                : 'bg-white/[0.02] border border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
            }`}
            title={evt.title}
          >
            {evt.title}
          </button>
        ))}
      </div>

      {/* Grid Layout of photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" id="gallery-grid">
        {filteredGallery.length > 0 ? (
          filteredGallery.map((item, idx) => (
            <div
              key={item.id}
              id={`gallery-item-card-${item.id}`}
              className="
                group relative overflow-hidden p-2.5 rounded-2xl cursor-pointer
                bg-white/[0.03] border border-white/10 backdrop-blur-xl
                shadow-[0_8px_28px_rgba(0,0,0,0.32)]
                transition-all duration-500 ease-out
                hover:-translate-y-1.5 hover:border-orange-500/30
                hover:shadow-[0_20px_46px_rgba(0,0,0,0.5),0_0_32px_rgba(255,107,0,0.12)]
              "
              onClick={() => setLightboxIndex(idx)}
            >
              {/* Ambient glow wash on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,107,0,0.10),transparent_70%)]" />

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950">
                <img
                  src={item.image_url}
                  alt={item.caption || "CSE SBCE Coding Club event capture"}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                />
                {/* Bottom gradient for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity duration-500" />
                {/* Diagonal shine sweep */}
                <div
                  className="
                    absolute top-0 -left-full w-1/2 h-full
                    bg-gradient-to-r from-transparent via-white/25 to-transparent
                    skew-x-[-20deg] group-hover:left-[150%]
                    transition-[left] duration-1000 ease-out
                  "
                />
                {/* Expand icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-2.5 bg-black/60 border border-white/20 backdrop-blur-md rounded-full text-white shadow-[0_0_20px_rgba(255,107,0,0.2)]">
                    <Maximize2 className="w-4 h-4 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Caption and event label */}
              <div className="relative p-3 space-y-1.5">
                <span className="font-mono text-[9px] text-orange-400/90 uppercase block tracking-wider">
                  {getEventTitle(item.event_id)}
                </span>
                <p className="text-neutral-300 text-xs line-clamp-2 leading-relaxed">
                  {item.caption || "No description configured."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 border border-dashed border-white/10 rounded-2xl p-16 text-center text-neutral-500 font-mono text-xs bg-white/[0.02] backdrop-blur-sm">
            No photographs have been uploaded to this specific album yet. Check back later!
          </div>
        )}
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setLightboxIndex(null)}
          id="gallery-lightbox"
        >
          {/* Top Control Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between text-white mb-4 z-10">
            <div className="font-mono text-xs text-neutral-400">
              Viewing photo <b className="text-orange-500">{lightboxIndex + 1}</b> of <b>{filteredGallery.length}</b>
            </div>
            <button
              id="lightbox-close-btn"
              onClick={() => setLightboxIndex(null)}
              className="px-4 py-1.5 bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-white/25 text-white rounded-full text-xs font-mono transition-all focus:outline-none"
            >
              Close [Esc]
            </button>
          </div>

          {/* Core Image Slide Container */}
          <div className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center">
            {/* Left navigation arrow */}
            <button
              id="lightbox-prev-btn"
              onClick={handlePrev}
              className="absolute left-2 md:-left-16 p-3 bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-orange-500/30 text-white rounded-full transition-all focus:outline-none"
            >
              <ChevronLeft className="w-5 h-5 text-orange-500" />
            </button>

            {/* Lightbox Image */}
            <img
              src={filteredGallery[lightboxIndex].image_url}
              alt={filteredGallery[lightboxIndex].caption || "Full size photo capture"}
              className="max-w-full max-h-[70vh] object-contain rounded-xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Right navigation arrow */}
            <button
              id="lightbox-next-btn"
              onClick={handleNext}
              className="absolute right-2 md:-right-16 p-3 bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-orange-500/30 text-white rounded-full transition-all focus:outline-none"
            >
              <ChevronRight className="w-5 h-5 text-orange-500" />
            </button>
          </div>

          {/* Bottom Info Card */}
          <div
            className="relative w-full max-w-4xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl rounded-2xl p-5 mt-6 space-y-2 text-center shadow-[0_16px_44px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[10px] text-orange-400 uppercase tracking-widest block font-bold">
              {getEventTitle(filteredGallery[lightboxIndex].event_id)}
            </span>
            <p className="text-neutral-300 text-sm leading-relaxed max-w-2xl mx-auto">
              {filteredGallery[lightboxIndex].caption || "SBCE Department of Computer Science & Engineering Coding Club."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
