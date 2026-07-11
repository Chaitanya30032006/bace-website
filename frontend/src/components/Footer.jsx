import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import Logo from './Logo';

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YoutubeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Mission */}
          <div className="flex flex-col gap-4">
            <Logo className="h-14 w-14" dark />
            <p className="text-sm leading-relaxed max-w-sm">
              Dedicated to facilitating spiritual education, devotional character building, and cultural enrichment for the devotee community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Quick Information</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-saffron-500 shrink-0" />
                <span>Mayapur Bace, Dharamraj Chowk, behind Vaishnav Devi Temple, Gawade Wada, Gurudwara Colony, Akurdi, Pimpri-Chinchwad, Maharashtra 411033</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-saffron-500 shrink-0" />
                <span>+91 98608 49209</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-saffron-500 shrink-0" />
                <span>+91 7517675290</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-saffron-500 shrink-0" />
                <span>yuvarajkaple321@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Connect With Us</h3>
            <p className="text-sm">Join our regular spiritual discourses, youth assemblies, and congregational gatherings.</p>
            <div className="flex items-center gap-4 mt-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-saffron-500 hover:bg-slate-700 transition-colors">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-saffron-500 hover:bg-slate-700 transition-colors">
                <YoutubeIcon className="h-5 w-5" />
              </a>
              <a href="https://iskcon.org" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-saffron-500 hover:bg-slate-700 transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-xs">
          <p>© {new Date().getFullYear()} BhaktiVedanta Academy for Culture and Education (BACE) Nigdi. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
