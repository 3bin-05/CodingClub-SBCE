export interface Event {
  id: string;
  title: string;
  description: string;
  banner: string;
  venue: string;
  date: string;
  time: string;
  speaker: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  registration_link: string;
  certificate_link: string;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  name: string;
  position: string;
  bio: string;
  image: string;
  linkedin: string;
  github: string;
  instagram: string;
  email: string;
  display_order: number;
}

export interface GalleryItem {
  id: string;
  event_id: string;
  image_url: string;
  caption: string;
}

export interface Settings {
  heroText?: string;
  heroSubtext?: string;
  heroTagline?: string;
  aboutHistory?: string;
  aboutMission?: string;
  aboutVision?: string;
  aboutObjectives?: string[];
  aboutCoordinators?: Array<{ name: string; title: string }>;
  statistics?: {
    members?: number;
    events?: number;
    hackathons?: number;
    projects?: number;
    yearsActive?: number;
  };
  socialLinks?: {
    email?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    location?: string;
    mapEmbedUrl?: string;
  };
  footerText?: string;
}
