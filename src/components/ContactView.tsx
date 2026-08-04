import React from 'react';
import { Mail, Instagram, Linkedin, Github, MapPin, ArrowUpRight } from 'lucide-react';
import { Settings } from '../types';

interface ContactViewProps {
  settings: Settings;
}

export default function ContactView({ settings }: ContactViewProps) {
  const socials = settings.socialLinks ?? {};

  // Build social cards only for links the admin has configured
  const socialCards = [
    ...(socials.email
      ? [{ label: 'Email Desk', value: socials.email, href: `mailto:${socials.email}`, icon: Mail }]
      : []),
    ...(socials.instagram
      ? [{
          label: 'Instagram',
          value: '@' + (socials.instagram.split('/').filter(Boolean).pop() ?? 'instagram'),
          href: socials.instagram,
          icon: Instagram,
        }]
      : []),
    ...(socials.linkedin
      ? [{ label: 'LinkedIn', value: 'SBCE Coding Club', href: socials.linkedin, icon: Linkedin }]
      : []),
    ...(socials.github
      ? [{
          label: 'GitHub',
          value: socials.github.split('/').filter(Boolean).pop() ?? 'GitHub',
          href: socials.github,
          icon: Github,
        }]
      : []),
  ];

  const hasLocationSection = !!(socials.location || socials.mapEmbedUrl);

  return (
    <div className="space-y-12 pb-20" id="contact-view">

      {/* Header */}
      <div className="space-y-4 max-w-2xl" id="contact-header">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-mono border-l-4 border-orange-500 pl-4">
          Connect With Us
        </h1>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          Have an inquiry regarding upcoming hackathons, sponsorship slots, coordinate roles, or
          certificate records? Reach us through any of the channels below.
        </p>
      </div>

      {/* Social / Contact channel cards */}
      {socialCards.length > 0 ? (
        <div
          className={`grid gap-6 ${
            socialCards.length === 1
              ? 'grid-cols-1 max-w-xs'
              : socialCards.length === 2
              ? 'grid-cols-2 max-w-sm'
              : socialCards.length === 3
              ? 'grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-4'
          }`}
          id="contact-cards"
        >
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
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className="text-white text-xs font-mono truncate max-w-full block">
                  {card.value}
                </span>
              </div>
              <ArrowUpRight className="relative w-3.5 h-3.5 text-neutral-600 group-hover:text-orange-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
            </a>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-neutral-600 font-mono text-xs">
          No contact channels configured. Set social links via the Admin panel.
        </div>
      )}

      {/* Location + Map section — only render if any location data exists */}
      {hasLocationSection && (
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
            {/* Ambient glow */}
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
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />
                  Location
                </h2>
                {socials.location && (
                  <p className="text-neutral-400 text-xs leading-relaxed">{socials.location}</p>
                )}
              </div>
            </div>

            {socials.mapEmbedUrl && (
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
            )}
          </div>

          {/* Map Card */}
          <div className="lg:col-span-8" id="map-section">
            {socials.mapEmbedUrl ? (
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
                />
                <span className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-orange-300 bg-black/70 border border-orange-500/40 backdrop-blur-md">
                  SBCE Campus Map
                </span>
                <div className="pointer-events-none absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-orange-500/50 rounded-tl-lg" />
                <div className="pointer-events-none absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-orange-500/50 rounded-br-lg" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] rounded-2xl border border-dashed border-white/10 text-neutral-600 text-xs font-mono">
                No map configured. Set a map embed URL via Admin panel.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
