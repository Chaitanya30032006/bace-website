import React from 'react';
const { useState, useEffect } = React;
import { Link } from 'react-router-dom';
import { Users, Image, Award, ArrowRight, BookOpen, Compass, Heart } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function Home() {
  const [stats, setStats] = useState({
    totalDevotees: null,
    totalMemories: null,
    activeMembers: null
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const fetchPublicStats = async () => {
      setStatsLoading(true);
      setStatsError('');
      try {
        const res = await fetch(apiUrl('/api/auth/public-stats'));
        if (!res.ok) {
          throw new Error('Unable to fetch public stats right now.');
        }
        const json = await res.json();
        if (json.status === 'success') {
          setStats({
            totalDevotees: json.data.totalDevotees,
            totalMemories: json.data.totalMemories,
            activeMembers: json.data.activeMembers
          });
          return;
        }
        throw new Error('Unable to fetch public stats right now.');
      } catch (e) {
        setStatsError('Live community numbers are temporarily unavailable.');
      } finally {
        setStatsLoading(false);
      }
    };
    fetchPublicStats();
  }, []);

  const formatStat = (value) => {
    if (statsLoading) return '...';
    if (value === null || value === undefined) return 'N/A';
    return value;
  };

  return (
    <div className="flex flex-col min-h-screen bg-orange-50/20 dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-48 pb-20 px-4 text-center sm:px-6 lg:px-8 border-b border-orange-100/30 dark:border-slate-900 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent">
        {/* Background decorative rings */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-saffron-500/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="absolute top-1/2 left-1/2 -z-10 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-500/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        {/* Srila Prabhupada background image */}
        <div className="absolute inset-0 z-0 flex items-start justify-center pt-4 pointer-events-none">
          <img 
            src="/hero-bg.jpg" 
            alt="" 
            className="max-h-[420px] w-auto object-contain opacity-50 dark:opacity-35"
          />
        </div>

        <div className="mx-auto max-w-4xl flex flex-col items-center gap-6 relative z-10">

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl leading-tight">
            BhaktiVedanta Academy for <br />
            <span className="bg-gradient-to-r from-saffron-600 via-saffron-400 to-gold-500 bg-clip-text text-transparent dark:from-saffron-400 dark:to-gold-300">
              Culture and Education (BACE)
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            A platform dedicated to devotional growth, spiritual education, cultural development, and community engagement. Connect, track your spiritual readings, and cherish devotional memories.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link 
              to="/register" 
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 text-white font-extrabold text-base shadow-lg shadow-saffron-500/20 hover:shadow-xl hover:shadow-saffron-500/30 transform hover:-translate-y-0.5 transition-all"
            >
              Join Our Community
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              to="/login" 
              className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-extrabold text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Counter section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-10 relative z-10">
        {statsError && (
          <div className="mb-4 rounded-xl border border-amber-200/50 bg-amber-50/70 px-4 py-2 text-xs font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
            {statsError}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Devotees Counter */}
          <div className="flex items-center justify-between p-6 rounded-2xl glass-panel shadow-lg hover:shadow-xl hover:border-saffron-300/40 transition-all border border-orange-100/40">
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-saffron-700 dark:text-saffron-400">{formatStat(stats.totalDevotees)}</span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Devotees</span>
            </div>
            <div className="p-3.5 rounded-xl bg-saffron-100/50 dark:bg-saffron-950/20 text-saffron-600 dark:text-saffron-400">
              <Users className="h-7 w-7" />
            </div>
          </div>

          {/* Memories Counter */}
          <div className="flex items-center justify-between p-6 rounded-2xl glass-panel shadow-lg hover:shadow-xl hover:border-saffron-300/40 transition-all border border-orange-100/40">
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-saffron-700 dark:text-saffron-400">{formatStat(stats.totalMemories)}</span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Memories</span>
            </div>
            <div className="p-3.5 rounded-xl bg-saffron-100/50 dark:bg-saffron-950/20 text-saffron-600 dark:text-saffron-400">
              <Image className="h-7 w-7" />
            </div>
          </div>

          {/* Active Members Counter */}
          <div className="flex items-center justify-between p-6 rounded-2xl glass-panel shadow-lg hover:shadow-xl hover:border-saffron-300/40 transition-all border border-orange-100/40">
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold text-saffron-700 dark:text-saffron-400">{formatStat(stats.activeMembers)}</span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Members</span>
            </div>
            <div className="p-3.5 rounded-xl bg-saffron-100/50 dark:bg-saffron-950/20 text-saffron-600 dark:text-saffron-400">
              <Award className="h-7 w-7" />
            </div>
          </div>
        </div>
      </section>

      {/* Welcome & Mission Statement */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-saffron-700 dark:text-saffron-400 font-bold uppercase text-xs tracking-widest">
            <Compass className="h-4 w-4" />
            Welcome Message & Mission
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            Nurturing Spiritual Character and Cultural Heritage
          </h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            The BhaktiVedanta Academy for Culture and Education (BACE) provides systematic education and training in Vedic philosophy, character development, and devotional practices. Our goal is to empower devotees to balance spiritual ideals with active social and professional lives.
          </p>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-saffron-100 dark:bg-saffron-950/30 text-saffron-600 dark:text-saffron-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">1</div>
              <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-800 dark:text-white">Philosophy & Education</span>: Regular study of scriptural texts including Bhagavad Gita and Srimad Bhagavatam.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-saffron-100 dark:bg-saffron-950/30 text-saffron-600 dark:text-saffron-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">2</div>
              <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-800 dark:text-white">Community Engagement</span>: Providing a supportive networking space for congregation devotees.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-saffron-100 dark:bg-saffron-950/30 text-saffron-600 dark:text-saffron-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">3</div>
              <p className="text-sm text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-800 dark:text-white">Memories Repository</span>: Preserving logs, festival albums, and yatra photos of Mayapur BACE devotees.</p>
            </div>
          </div>
        </div>

        {/* Decorative Quote Panel */}
        <div className="p-8 md:p-10 rounded-3xl text-white relative overflow-hidden shadow-xl">
          {/* Background image with blur */}
          <div className="absolute inset-0">
            <img src="/chaitanya-bg.jpg" alt="" className="w-full h-full object-cover blur-[1px] scale-105 object-[center_30%]" />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
          {/* Graphic Overlay */}
          <div className="absolute right-0 bottom-0 h-40 w-40 opacity-10 bg-white rounded-full translate-x-12 translate-y-12" />
          
          <div className="relative z-10 pt-32">
          
          <div className="text-center mb-6">
            <p className="text-xl italic font-bold leading-relaxed mb-1">jīve dayā nāme ruci vaiṣṇava sevana</p>
            <p className="text-xl italic font-bold leading-relaxed mb-4">ihā chāra dharma nāhi śuna sanātana</p>
            <p className="text-base font-semibold leading-relaxed mb-4">"Hear, Sanātana! Kindness to all living beings, taste for the holy name, and service to Vaiṣṇavas—apart from these there is no other religion."</p>
            <p className="text-sm leading-relaxed text-orange-100">When one has a taste for the holy name, one develops more compassion for the jīvas. When one becomes free from offenses to the Vaiṣṇavas, offenses rooted in envy, hatred, and false competition, the spirit of rendering genuine service to the Vaiṣṇavas awakens.</p>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
