import React from 'react';
import { Mail, Instagram, Linkedin, Github, MapPin, ArrowUpRight } from 'lucide-react';
import { Settings } from '../types';

interface ContactViewProps {
  settings: Settings;
}

export default function ContactView({ settings }: ContactViewProps) {
  const socials = settings.socialLinks || {
    email: "sbcecodingclub@gmail.com",
    instagram: "https://instagram.com/sbce_codingclub",
    linkedin: "https://linkedin.com/company/sbce-codingclub",
    location: "Sree Buddha College of Engineering, Pattoor, Nooranad, Alappuzha, Kerala - 690529",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3936.815309325603!2d76.6042171147889!3d9.171249993421379!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06117f77777777%3A0x6b4f707cfbdfa9f7!2sSree%20Buddha%20College%20of%20Engineering%20%2C%20Pattoor!5e0!3m2!1sen!2sin!4v1626245999999!5m2!1sen!2sin"
  };

  const socialCards = [
    { label: 'Email Desk', value: socials.email, href: `mailto:${socials.email}`, icon: Mail },
    { label: 'Instagram', value: '@sbce_codingclub', href: socials.instagram, icon: Instagram },
    { label: 'LinkedIn', value: 'SBCE Coding Club', href: socials.linkedin, icon: Linkedin },
  ];

  return (
    <div className="space-y-12 pb-20" id="contact-view">
      {/* 4.6 Header */}
      <div className="space-y-4 max-w-2xl" id="contact-header">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-mono border-l-4 border-orange-500 pl-4">
          Connect With Us
        </h1>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          Have an inquiry regarding upcoming hackathons, sponsorship slots, coordinate roles, or certificate records? Reach us through any of the channels below.
        </p>
      </div>

      {/* ─── Row 1: Social / Contact channel cards, spread full width ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6" id="contact-cards">
        {socialCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            target={card.href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noreferrer"
            className="
              group relative flex flex-col items-center justify-center text-center gap-3 p-6 rounded-2xl overflow-hidden
              bg-white/[0.03] border border-white/10 backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.35)]
              transition-all duration-500 ease-out
              hover:-translate-y-1.5 hover:border-orange-500/30
              hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(255,107,0,0.12)]
            "
          >
            {/* Gradient glow on hover */}
            <div
              className="
                pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
                transition-opacity duration-500
                bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,107,0,0.12),transparent_70%)]
              "
            />
            {/* Diagonal shine sweep */}
            <div
              className="
                pointer-events-none absolute top-0 -left-full w-1/2 h-full
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                skew-x-[-20deg] group-hover:left-[150%]
                transition-[left] duration-1000 ease-out
              "
            />
            <div className="relative w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors duration-300">
              <card.icon className="w-5 h-5 text-orange-500 group-hover:text-black transition-colors duration-300" />
            </div>
            <div className="relative space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">{card.label}</span>
              <span className="text-white text-xs font-mono truncate max-w-full block">{card.value}</span>
            </div>
            <ArrowUpRight className="relative w-3.5 h-3.5 text-neutral-600 group-hover:text-orange-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
          </a>
        ))}
      </div>

      {/* ─── Row 2: Location details + Campus map, spread across the full width ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="contact-grid">
        {/* Location Card */}
        <div
          className="
            lg:col-span-4 group relative flex flex-col gap-6 p-7 rounded-2xl overflow-hidden
            bg-white/[0.03] border border-white/10 backdrop-blur-xl
            shadow-[0_8px_32px_rgba(0,0,0,0.35)]
            transition-all duration-500 ease-out
            hover:border-orange-500/30
          "
          id="contact-location-card"
        >
          <div
            className="
              pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100
              transition-opacity duration-500
              bg-[radial-gradient(120%_60%_at_0%_0%,rgba(255,107,0,0.10),transparent_70%)]
            "
          />

          <div className="relative space-y-4">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span>
                Location
              </h2>
              <p className="text-neutral-400 text-xs leading-relaxed">{socials.location}</p>
            </div>
          </div>

          <div className="relative pt-6 mt-auto border-t border-white/10 space-y-3">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">Department</span>
            <p className="text-neutral-300 text-xs leading-relaxed">
              Computer Science & Engineering, Sree Buddha College of Engineering — home base of the student developer collective.
            </p>
          </div>

          <a
            href={socials.mapEmbedUrl.replace('/embed?pb=', '/place?q=')}
            target="_blank"
            rel="noreferrer"
            className="
              relative inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
              bg-orange-600 hover:bg-orange-500 text-black font-mono text-xs font-bold uppercase tracking-wider
              shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_28px_rgba(255,107,0,0.28)]
              transition-all duration-300
            "
          >
            Get Directions
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Map Card */}
        <div className="lg:col-span-8 space-y-3" id="map-section">
          <div
            className="
              relative rounded-2xl overflow-hidden p-2 h-full min-h-[420px]
              bg-white/[0.03] border border-white/10 backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.35)]
            "
          >
            <iframe
              title="SBCE Campus Location"
              src={socials.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-xl grayscale contrast-125 filter absolute inset-2"
              id="contact-map-iframe"
            ></iframe>
            {/* Label chip */}
            <span className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-orange-300 bg-black/70 border border-orange-500/40 backdrop-blur-md">
              SBCE Campus Map
            </span>
            {/* corner accents to match hero panel language */}
            <div className="pointer-events-none absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-orange-500/50 rounded-tl-lg" />
            <div className="pointer-events-none absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-orange-500/50 rounded-br-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
