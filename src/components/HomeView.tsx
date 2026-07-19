import React from 'react';
import { Users, Calendar, Trophy, FolderCode, ArrowUpRight, ArrowRight, Github, Linkedin, Instagram, Mail, MapPin, Zap, GitBranch } from 'lucide-react';
import { Event, Member, Settings } from '../types';
import heroImage from '../assets/images/HeroBG.png';

interface HomeViewProps {
  settings: Settings;
  events: Event[];
  members: Member[];
  setTab: (tab: string) => void;
  onSelectEvent: (event: Event) => void;
}

export default function HomeView({ settings, events, members, setTab, onSelectEvent }: HomeViewProps) {
  // Filter for upcoming/ongoing events
  const upcomingEvents = events.filter(e => e.status !== 'Completed').slice(0, 2);
  const committeePreview = members.slice(0, 4);

  return (
    <div id="home-view">
      {/* ═══════════════════════════════════════════════
          HERO — asymmetric split: identity left, the club
          rendered as a live config file, right.
          ═══════════════════════════════════════════════ */}
      <section
        className="relative w-full min-h-screen overflow-hidden bg-black"
        id="hero-section"
        style={{ marginTop: '-1px' }}
      >
        {/* Background image — sits behind every other hero layer */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${heroImage})` }}
          id="hero-image-bg-container"
        />

        {/* Dark overlay — stronger on the left where the headline sits, so text stays legible */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/70 to-black/55 pointer-events-none"
          aria-hidden="true"
        />
        {/* Fine grain — keeps the black from feeling flat */}
        <div className="absolute inset-0 hero-grain pointer-events-none" aria-hidden="true" />

        {/* Blueprint grid — a quiet nod to the engineering department */}
        <div className="absolute inset-0 hero-blueprint pointer-events-none" aria-hidden="true" />

        {/* Directional ember glow, anchored behind the config panel */}
        <div
          className="absolute top-[18%] right-[4%] w-[560px] h-[560px] hero-glow pointer-events-none"
          aria-hidden="true"
        />

        {/* Resolve cleanly into the page below */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 min-h-screen flex items-center pt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center w-full">

            {/* ── Left: identity & entry points ── */}
            <div className="lg:col-span-7 space-y-8" id="hero-copy">
              <h1
                className="font-bungee text-white leading-[0.92] tracking-tight"
                style={{ fontSize: 'clamp(2.75rem, 8vw, 6.25rem)' }}
                id="hero-headline"
              >
                <span className="block hero-reveal" style={{ animationDelay: '90ms' }}>CODING</span>
                <span className="block hero-reveal" style={{ animationDelay: '180ms' }}>CLUB</span>
                <span className="block hero-reveal text-orange-500" style={{ animationDelay: '270ms' }}>SBCE</span>
              </h1>

              <p
                className="hero-reveal max-w-md text-neutral-400 text-sm md:text-base leading-relaxed"
                style={{ animationDelay: '360ms' }}
                id="hero-tagline"
              >
                The student developer collective at SBCE. We run hackathons, ship
                open-source between lectures, and turn CSE coursework into things
                people actually use.
              </p>

              <div
                className="hero-reveal flex flex-wrap items-center gap-4"
                style={{ animationDelay: '450ms' }}
                id="hero-actions"
              >
                {/* Primary CTA — solid glass, the main conversion path */}
                <button
                  onClick={() => setTab('events')}
                  className="hero-btn-explore"
                  id="hero-explore-events-btn"
                >
                  <span>Explore Events</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Secondary CTA — quiet ghost button, distinct id and treatment
                    so it doesn't compete visually with the primary action */}
                <button
                  onClick={() => setTab('about')}
                  className="hero-btn-ghost"
                  id="hero-meet-execom-btn"
                >
                  <span>Meet Our Execom</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Right: signature element — the club as a config file ── */}
            <div className="lg:col-span-5 hero-reveal" style={{ animationDelay: '300ms' }} id="hero-panel-wrap">
              <div
                className="
                  relative rounded-2xl overflow-hidden
                  bg-white/[0.03] border border-white/10 backdrop-blur-xl
                  shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                "
                id="hero-code-panel"
              >
                {/* Tab strip */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/40">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500/70" />
                    <span className="text-[11px] font-mono">club.config.ts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <GitBranch className="w-3 h-3" />
                    <span className="text-[10px] font-mono">main</span>
                  </div>
                </div>

                {/* Code body */}
                <div className="p-6 font-mono text-[12.5px] leading-[1.9] overflow-x-auto">
                  <pre className="text-neutral-300">
                    <span className="hero-code-line block text-neutral-600 italic" style={{ animationDelay: '620ms' }}>
                      {'// student-run, not corporate-run'}
                    </span>
                    <span className="hero-code-line block" style={{ animationDelay: '700ms' }}>
                      <span className="text-orange-500">export const</span> club = {'{'}
                    </span>
                    <span className="hero-code-line block pl-4" style={{ animationDelay: '780ms' }}>
                      <span className="text-neutral-500">name:</span> <span className="text-white">"SBCE Coding Club"</span>,
                    </span>
                    <span className="hero-code-line block pl-4" style={{ animationDelay: '860ms' }}>
                      <span className="text-neutral-500">dept:</span> <span className="text-white">"Computer Science & Engineering"</span>,
                    </span>
                    <span className="hero-code-line block pl-4" style={{ animationDelay: '940ms' }}>
                      <span className="text-neutral-500">founded:</span> <span className="text-white">2021</span>,
                    </span>
                    <span className="hero-code-line block pl-4" style={{ animationDelay: '1020ms' }}>
                      <span className="text-neutral-500">ships:</span> [<span className="text-white">"hackathons"</span>, <span className="text-white">"workshops"</span>, <span className="text-white">"OSS"</span>],
                    </span>
                    <span className="hero-code-line block pl-4" style={{ animationDelay: '1100ms' }}>
                      <span className="text-neutral-500">status:</span> <span className="text-white">"actively building"</span>
                      <span className="hero-cursor">&#9608;</span>
                    </span>
                    <span className="hero-code-line block" style={{ animationDelay: '1180ms' }}>
                      {'};'}
                    </span>
                  </pre>
                </div>
              </div>

              <p className="mt-4 text-[10px] font-mono text-neutral-600 text-center" id="hero-panel-caption">
                version-controlled, like everything else we build
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Constrained sections below hero ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-20 pt-16">

        {/* 4.1 Statistics Section */}
        <section className="border-t border-b border-neutral-900 py-10" id="stats-section">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8" id="stats-grid">
            {[
              { label: 'Active Members', value: `${settings.statistics?.members || 240}+`, icon: Users },
              { label: 'Events Hosted', value: settings.statistics?.events || 28, icon: Calendar },
              { label: 'Hackathons', value: settings.statistics?.hackathons || 5, icon: Trophy },
              { label: 'Open-Source Projects', value: `${settings.statistics?.projects || 12}+`, icon: FolderCode },
              { label: 'Years Active', value: `${settings.statistics?.yearsActive || 5}Y`, icon: Zap },
            ].map((stat, i) => (
              <div key={i} id={`stat-card-${i}`} className="text-center md:text-left space-y-2 p-4 bg-zinc-950/40 border border-neutral-900 rounded-xl hover:border-neutral-800 transition-colors">
                <div className="flex items-center justify-center md:justify-start gap-2 text-neutral-500">
                  <stat.icon className="w-4 h-4 text-orange-500/80" />
                  <span className="text-xs font-mono tracking-wider uppercase">{stat.label}</span>
                </div>
                <p className="text-3xl md:text-4xl font-black text-white font-mono">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12" id="upcoming-events-preview-section">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6" id="upcoming-events-preview-grid">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  id={`upcoming-preview-card-${evt.id}`}
                  className="
            group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col
            bg-white/[0.03] border border-white/10 backdrop-blur-xl
            shadow-[0_8px_32px_rgba(0,0,0,0.35)]
            transition-all duration-500 ease-out
            hover:-translate-y-1.5 hover:border-orange-500/30
            hover:shadow-[0_24px_55px_rgba(0,0,0,0.5),0_0_40px_rgba(255,107,0,0.14)]
          "
                  onClick={() => onSelectEvent(evt)}
                >
                  {/* Animated gradient border glow ring */}
                  <div
                    className="
              pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100
              transition-opacity duration-500 -z-10
              bg-[conic-gradient(from_0deg,rgba(255,107,0,0.5),transparent_25%,transparent_75%,rgba(255,107,0,0.5))]
              animate-[spin_4s_linear_infinite]
            "
                  />
                  <div className="absolute inset-[1px] rounded-2xl bg-black/70 -z-10" />

                  {/* Banner image */}
                  <div className="aspect-video relative overflow-hidden bg-neutral-950">
                    <img
                      src={evt.banner}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    {/* Bottom gradient for legibility / depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    {/* Diagonal shine sweep */}
                    <div
                      className="
                absolute top-0 -left-full w-1/2 h-full
                bg-gradient-to-r from-transparent via-white/20 to-transparent
                skew-x-[-20deg] group-hover:left-[150%]
                transition-[left] duration-1000 ease-out
              "
                    />

                    {/* Status pill – glassy */}
                    <span
                      className="
                absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider
                text-orange-300 bg-black/50 border border-orange-500/40 backdrop-blur-md
                shadow-[0_0_14px_rgba(255,107,0,0.2)]
                flex items-center gap-1.5
              "
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-70" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400" />
                      </span>
                      {evt.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="relative p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                        {evt.date} • {evt.venue}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors duration-300 font-mono line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed">{evt.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-white/10">
                      <span className="text-orange-500/80 group-hover:text-orange-400 transition-colors">
                        Register Now
                      </span>
                      <span
                        className="
                  flex items-center justify-center w-7 h-7 rounded-full
                  bg-white/[0.04] border border-white/10 text-neutral-500
                  group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-black
                  group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                  transition-all duration-300
                "
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 border border-dashed border-white/10 rounded-2xl p-8 text-center text-neutral-500 font-mono text-sm bg-white/[0.02] backdrop-blur-sm">
                All currently scheduled events are successfully completed. Stay tuned for new tracks!
              </div>
            )}
          </div>
        </section>

        {/* Premium Footer */}
        <footer className="border-t border-neutral-900 pt-10 mt-16" id="home-footer">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-sm text-neutral-500" id="footer-grid">
            <div className="md:col-span-5 space-y-4">
              <span className="text-white font-mono font-bold tracking-tight text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                CSE SBCE CODING CLUB
              </span>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                Sree Buddha College of Engineering, Alappuzha, Kerala. An active developer incubator organizing code seminars, cross-framework camps, and design sprint challenges.
              </p>
            </div>
            <div className="md:col-span-4 space-y-3">
              <span className="text-white text-xs uppercase font-mono tracking-wider">Campus Headquarters</span>
              <p className="text-xs text-neutral-400 leading-relaxed flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Department of Computer Science & Engineering,<br />Pattoor PO, Nooranad, Kerala 690529</span>
              </p>
            </div>
            <div className="md:col-span-3 space-y-3">
              <span className="text-white text-xs uppercase font-mono tracking-wider">Digital Outreach</span>
              <div className="flex gap-4">
                <a href={settings.socialLinks?.github} target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
                <a href={settings.socialLinks?.linkedin} target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href={settings.socialLinks?.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a>
                <a href={`mailto:${settings.socialLinks?.email}`} className="hover:text-white transition-colors"><Mail className="w-4 h-4" /></a>
              </div>
              <p className="text-xs text-neutral-400 pt-1 font-mono">
                {settings.socialLinks?.email || "codingclub@sbce.ac.in"}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 mt-10 border-t border-neutral-950 text-xs text-neutral-500" id="footer-bottom">
            <span className="font-mono">{settings.footerText || "© 2026 CSE SBCE Coding Club. Engineered for developers, by developers."}</span>
            <div className="flex gap-6 font-mono text-[10px]">
              <button onClick={() => setTab('admin')} className="hover:text-orange-500 transition-colors">Admin Portal</button>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>{/* end constrained wrapper */}
    </div>
  );
}
