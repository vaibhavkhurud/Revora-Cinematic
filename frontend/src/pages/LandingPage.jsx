import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  Trophy,
  Lightbulb,
  Star,
  Calendar,
  DollarSign,
  Camera,
  MapPin,
  Check,
  Menu,
  X,
  ArrowRight,
  Briefcase,
  Zap,
  CheckCircle,
  Clock,
  HeartHandshake,
  PlayCircle,
  Video,
  BadgeCheck,
  Rocket,
  PhoneCall,
  ImagePlus,
  BarChart3,
  Layers3
} from 'lucide-react';
import heroImage from '../assets/hero.png';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-yellow-500 selection:text-black">

      {/* Ambient background glows — clipped so they never extend past the page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[60%] h-[60%] bg-yellow-600/5 rounded-full blur-[150px]" />
      </div>

      {/* ─── NAVBAR ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#030712]/80 backdrop-blur-md border-b border-gray-800/50 py-4 shadow-lg' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <svg className="w-9 h-9 transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 100 100" fill="none">
              <path d="M25 20H60C72 20 80 28 80 40C80 52 72 60 60 60H37V80" stroke="url(#gNav)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M37 20V80" stroke="url(#gNav)" strokeWidth="10" strokeLinecap="round"/>
              <path d="M47 55L73 80" stroke="url(#gNav)" strokeWidth="10" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gNav" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FDE047"/>
                  <stop offset="50%" stopColor="#CA8A04"/>
                  <stop offset="100%" stopColor="#A16207"/>
                </linearGradient>
              </defs>
            </svg>
            <div>
              <span className="text-xl font-bold tracking-wider text-white group-hover:text-yellow-400 transition-colors">REVORA</span>
              <span className="block text-[9px] tracking-[0.25em] text-yellow-500 uppercase font-semibold leading-none">Cinematic</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#problem"      className="text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors">Why It Matters</a>
            <a href="#services"     className="text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors">What We Offer</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors">How It Works</a>
            <a href="#benefits"     className="text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors">Benefits</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-700 text-black text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.45)] hover:scale-[1.02] transition-all duration-300">
              Register Your Showroom
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
            {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#030712]/95 backdrop-blur-lg border-b border-gray-800 py-6 px-4 flex flex-col gap-4 animate-fadeIn shadow-2xl">
            <a href="#problem"      onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-yellow-400 transition-colors py-2 border-b border-gray-800/50">Why It Matters</a>
            <a href="#services"     onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-yellow-400 transition-colors py-2 border-b border-gray-800/50">What We Offer</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-yellow-400 transition-colors py-2 border-b border-gray-800/50">How It Works</a>
            <a href="#benefits"     onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-yellow-400 transition-colors py-2 border-b border-gray-800/50">Benefits</a>
            <div className="flex flex-col gap-3 mt-4">
              <Link to="/login"    onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 text-base font-medium text-gray-300 hover:text-white bg-gray-900/50 border border-gray-800 rounded-xl transition-colors">Login</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-base font-bold rounded-xl shadow-lg">Register Your Showroom</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen pt-32 pb-20 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">

        {/* Backdrop image */}
        <div className="absolute inset-0 opacity-10 mix-blend-color-dodge pointer-events-none overflow-hidden">
          <img src={heroImage} alt="" className="w-full h-full object-cover scale-105"/>
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"/>

        <div className="relative max-w-5xl mx-auto text-center z-10 flex flex-col items-center">

          {/* Badge */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-xs font-bold tracking-widest uppercase">
              <PlayCircle size={14}/> Premium Cinematic Video Platform for Showrooms
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 uppercase leading-none">
            Showcase Your <br/>
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              Showroom
            </span>
            {' '}Like <br className="hidden sm:block"/>Never Before
          </h1>

          <p className="text-xl sm:text-2xl font-bold tracking-wide text-gray-300 max-w-3xl mb-4 uppercase">
            Premium Cinematic Video Shoots. On Demand. At Your Location.
          </p>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
            Revora connects your showroom with certified professional videographers who deliver stunning automotive cinematic content — so your inventory sells faster and your brand stands out.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
            <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 text-black font-extrabold rounded-2xl shadow-[0_4px_30px_rgba(234,179,8,0.25)] hover:shadow-[0_4px_40px_rgba(234,179,8,0.45)] hover:scale-[1.03] active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 group">
              Register Your Showroom
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <a href="#how-it-works" className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all text-center flex items-center justify-center gap-2">
              See How It Works
            </a>
          </div>

          {/* Quick stats strip */}
          <div className="w-full max-w-5xl glass rounded-3xl p-6 sm:p-8 border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"/>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">

              <div className="text-center flex flex-col items-center p-2">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-3">
                  <Camera className="text-yellow-500" size={24}/>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white uppercase">On-Demand Shoots</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Book anytime, shoot at your location</p>
              </div>

              <div className="text-center flex flex-col items-center p-2 border-l border-white/5">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-3">
                  <BadgeCheck className="text-yellow-500" size={24}/>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white uppercase">Vetted Videographers</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Certified cinematic professionals only</p>
              </div>

              <div className="text-center flex flex-col items-center p-2 border-l border-white/5">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-3">
                  <Zap className="text-yellow-500" size={24}/>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white uppercase">Fast Turnaround</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Quick delivery of polished content</p>
              </div>

              <div className="text-center flex flex-col items-center p-2 border-l border-white/5">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-3">
                  <BarChart3 className="text-yellow-500" size={24}/>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white uppercase">Sell More Cars</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Premium visuals that convert buyers</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ─── */}
      <section id="problem" className="py-24 border-t border-gray-900 bg-[#02050d] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-sm font-bold text-yellow-500 tracking-widest uppercase block">The Hard Truth</span>
                <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">
                  Mediocre Visuals <br className="hidden sm:inline"/>Cost You Sales
                </h2>
                <div className="h-[2px] w-20 bg-yellow-500 my-4"/>
                <p className="text-lg text-yellow-400 font-bold uppercase tracking-wider">
                  Today's luxury buyers decide online — before they ever step through your door.
                </p>
              </div>

              <div className="space-y-6">

                <div className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-[#030712]/50 hover:bg-[#030712] hover:border-yellow-500/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Video className="text-yellow-500" size={20}/>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-yellow-500 uppercase tracking-wide">Phone Footage Doesn't Cut It Anymore</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Buyers browsing high-end inventory expect cinematic quality. Poor visuals signal low trust and drive them to your competitors.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-[#030712]/50 hover:bg-[#030712] hover:border-yellow-500/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="text-yellow-500" size={20}/>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-yellow-500 uppercase tracking-wide">Your Competitors Are Investing in Premium Content</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Top showrooms are already leveraging cinematic video to dominate social media feeds, websites, and ads — and winning more walk-ins.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-[#030712]/50 hover:bg-[#030712] hover:border-yellow-500/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Clock className="text-yellow-500" size={20}/>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-yellow-500 uppercase tracking-wide">Hiring Freelancers Is Unreliable & Time-Consuming</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Vetting, negotiating, chasing deadlines — it pulls you away from selling. You need a trusted platform that handles it all.
                    </p>
                  </div>
                </div>

              </div>

              {/* Callout strips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 text-center flex flex-col items-center justify-center">
                  <Lightbulb className="text-yellow-500 mb-2" size={28}/>
                  <p className="text-sm font-bold uppercase tracking-wide text-white">Premium Content.</p>
                  <p className="text-xs text-yellow-400 font-extrabold uppercase tracking-widest mt-1">Premium Perception. More Sales.</p>
                </div>
                <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 text-center flex flex-col items-center justify-center">
                  <Trophy className="text-yellow-500 mb-2" size={28}/>
                  <p className="text-sm font-bold uppercase tracking-wide text-white">Stop Losing Buyers</p>
                  <p className="text-xs text-yellow-400 font-extrabold uppercase tracking-widest mt-1">to better-looking rivals.</p>
                </div>
              </div>
            </div>

            {/* Right card */}
            <div className="lg:col-span-5 relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition duration-1000"/>
              <div className="relative glass border border-white/15 rounded-3xl p-4 overflow-hidden aspect-[4/5] flex items-center justify-center bg-black/40">
                <img src={heroImage} alt="Cinematic automotive shoot" className="w-full h-full object-cover rounded-2xl brightness-75 contrast-110"/>
                <div className="absolute bottom-6 left-6 right-6 p-5 glass rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"/>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"/>
                    </span>
                    <span className="text-xs uppercase tracking-widest font-extrabold text-yellow-500">Live Shoot In Progress</span>
                  </div>
                  <h4 className="text-base font-bold text-white uppercase">Your Inventory Deserves This.</h4>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SERVICES / WHAT WE OFFER ─── */}
      <section id="services" className="py-24 bg-[#030712] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-sm font-bold text-yellow-500 tracking-widest uppercase block">Our Platform</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              Everything Your Showroom Needs
            </h2>
            <div className="h-[2.5px] w-24 bg-yellow-500 mx-auto my-3"/>
            <p className="text-lg text-gray-400 uppercase tracking-widest font-medium">
              One platform. Professional results. Zero hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">

            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="text-yellow-500" size={22}/>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">On-Demand Cinematic Shoots</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Book a professional cinematic video shoot for your showroom at any time. Choose your preferred date and we'll dispatch a verified videographer to your location.
              </p>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BadgeCheck className="text-yellow-500" size={22}/>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Certified Professionals Only</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Every videographer on our platform is vetted, trained in automotive cinematic production, and equipped with professional-grade gimbals and camera gear.
              </p>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers3 className="text-yellow-500" size={22}/>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Flexible Packages</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Choose from tailored packages — single-vehicle spotlights, full inventory showcases, or social media reels — all at transparent, fixed pricing.
              </p>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="text-yellow-500" size={22}/>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Location-Based Matching</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Our system automatically finds the closest available certified videographer near your showroom — minimising wait times and travel costs.
              </p>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="text-yellow-500" size={22}/>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Transparent Pricing</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                No hidden fees, no surprise invoices. Know exactly what you're paying before you confirm any booking. Clear and honest from the start.
              </p>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-yellow-500" size={22}/>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Fast Content Delivery</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Edited, ready-to-publish cinematic content delivered quickly through your dashboard — straight to your social feeds, website, and ads.
              </p>
            </div>

          </div>

          {/* Quote block */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-8 flex flex-col justify-center p-8 sm:p-10 border border-yellow-500/20 bg-yellow-500/[0.03] rounded-3xl text-center md:text-left relative">
              <span className="text-5xl font-serif text-yellow-500/20 absolute top-4 left-6 pointer-events-none">"</span>
              <p className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-yellow-400">
                Your Inventory Deserves to Be Seen at Its Best. We Make That Happen.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-5 glass rounded-2xl border border-white/5">
                <ShieldCheck className="text-yellow-500 shrink-0" size={22}/>
                <span className="text-sm font-bold text-white uppercase tracking-wide">Quality Guaranteed on Every Shoot.</span>
              </div>
              <div className="flex items-center gap-3 p-5 glass rounded-2xl border border-white/5">
                <Star className="text-yellow-500 shrink-0" size={22}/>
                <span className="text-sm font-bold text-white uppercase tracking-wide">Trusted by Showrooms Across the Region.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 bg-[#02050d] border-y border-gray-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
            <span className="text-sm font-bold text-yellow-500 tracking-widest uppercase block">Simple Process</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              How It Works
            </h2>
            <div className="h-[2.5px] w-24 bg-yellow-500 mx-auto my-3"/>
            <p className="text-lg text-gray-400 uppercase tracking-widest font-semibold">
              Register. Book. Shoot. Done.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">

            {[
              { num: '1', icon: <Building2 size={22} className="text-yellow-500"/>,   title: 'Register Your Showroom',        desc: 'Sign up and create your showroom profile. Quick approval and you\'re ready to start booking.' },
              { num: '2', icon: <Layers3   size={22} className="text-yellow-500"/>,   title: 'Choose a Package',              desc: 'Browse our curated shoot packages — single vehicles, full inventory or social reels.' },
              { num: '3', icon: <Calendar  size={22} className="text-yellow-500"/>,   title: 'Book a Shoot Date',             desc: 'Pick a date that works for you. We instantly match the nearest certified videographer.' },
              { num: '4', icon: <MapPin    size={22} className="text-yellow-500"/>,   title: 'We Arrive at Your Showroom',    desc: 'Your assigned professional arrives on time, fully equipped, ready to capture stunning footage.' },
              { num: '5', icon: <ImagePlus size={22} className="text-yellow-500"/>,   title: 'Receive Polished Content',      desc: 'Edited cinematic content is delivered to your dashboard — ready to publish anywhere.' },
              { num: '6', icon: <BarChart3 size={22} className="text-yellow-500"/>,   title: 'Attract & Convert Buyers',      desc: 'Use premium visuals on your website, social media and ads to drive more qualified leads.' },
            ].map((step) => (
              <div key={step.num} className="glass p-5 rounded-2xl border border-white/5 flex flex-col items-center text-center relative group hover:border-yellow-500/20 transition-all duration-300">
                <div className="absolute top-4 left-4 text-xs font-bold text-yellow-500/60 bg-yellow-500/10 w-6 h-6 rounded-full flex items-center justify-center border border-yellow-500/10">{step.num}</div>
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4 mt-2 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">{step.title}</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}

          </div>

          {/* Bottom banner */}
          <div className="mt-16 p-8 border border-white/5 bg-white/[0.01] rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                <HeartHandshake className="text-yellow-500" size={24}/>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider">We Handle Every Detail.</h4>
                <p className="text-sm text-gray-400">You focus on selling. We take care of the cinematic production.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center md:text-left border-t border-white/5 md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                <Rocket className="text-yellow-500" size={24}/>
              </div>
              <div>
                <h4 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">Get Started in Minutes.</h4>
                <p className="text-sm text-gray-400">Register today and book your first shoot within the hour.</p>
              </div>
            </div>
          </div>

          {/* Trust footnotes */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-12 text-xs uppercase tracking-[0.2em] font-bold text-gray-500 border-t border-gray-900 pt-8">
            {['Vetted Videographers', 'Transparent Pricing', 'Fast Turnaround', 'Quality Guaranteed'].map(t => (
              <span key={t} className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors cursor-default">
                <CheckCircle size={14} className="text-yellow-500/70"/> {t}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section id="benefits" className="py-24 bg-[#030712] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-sm font-bold text-yellow-500 tracking-widest uppercase block">Why Showrooms Choose Revora</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              Real Results for Your Business
            </h2>
            <div className="h-[2.5px] w-24 bg-yellow-500 mx-auto my-3"/>
            <p className="text-lg text-gray-400 uppercase tracking-widest font-medium">
              More Leads. Stronger Brand. Higher Conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">

            {[
              { icon: <BarChart3   size={22} className="text-yellow-500"/>, title: 'More Qualified Leads',          desc: 'Listings with cinematic video generate significantly more enquiries and test-drive bookings than static photo-only pages.' },
              { icon: <Star        size={22} className="text-yellow-500"/>, title: 'Premium Brand Perception',      desc: 'Cinematic content tells buyers your showroom is a premium destination — building trust before they even arrive.' },
              { icon: <TrendingUp  size={22} className="text-yellow-500"/>, title: 'Higher Conversion Rates',       desc: 'Buyers who watch a quality walk-around video are far more likely to call, enquire, or visit your showroom.' },
              { icon: <Clock       size={22} className="text-yellow-500"/>, title: 'Save Time & Resources',         desc: 'Skip the hassle of sourcing, vetting, and managing freelancers. Our platform handles everything end-to-end.' },
              { icon: <ShieldCheck size={22} className="text-yellow-500"/>, title: 'Consistent Quality, Every Time',desc: 'Every shoot follows our production standards so your content always looks polished and on-brand — shoot after shoot.' },
              { icon: <Briefcase   size={22} className="text-yellow-500"/>, title: 'Grow Your Online Presence',     desc: 'Regular cinematic content fuels your website, Instagram, YouTube, and ad campaigns — keeping your brand top of mind.' },
            ].map((item) => (
              <div key={item.title} className="glass p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-yellow-500/30 transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">{item.desc}</p>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"/>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass border border-yellow-500/25 bg-gradient-to-br from-yellow-500/[0.03] to-transparent p-12 sm:p-16 rounded-3xl text-center shadow-[0_0_50px_rgba(234,179,8,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent"/>

            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-4">
              Ready to Elevate <br/>
              <span className="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">Your Showroom?</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join showrooms already using Revora to showcase their inventory with stunning cinematic content. Register today and book your first professional shoot in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 text-black font-extrabold rounded-2xl shadow-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 group">
                Register Your Showroom
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-2xl transition-all">
                Member Login
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-900/80 bg-[#02050d] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Branding */}
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="flex items-center gap-3">
                <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                  <path d="M25 20H60C72 20 80 28 80 40C80 52 72 60 60 60H37V80" stroke="#EAB308" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M37 20V80" stroke="#EAB308" strokeWidth="10" strokeLinecap="round"/>
                  <path d="M47 55L73 80" stroke="#EAB308" strokeWidth="10" strokeLinecap="round"/>
                </svg>
                <div>
                  <span className="text-lg font-bold tracking-wider text-white">REVORA</span>
                  <span className="block text-[9px] tracking-[0.25em] text-yellow-500 uppercase font-semibold leading-none">Cinematic</span>
                </div>
              </Link>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                The premier on-demand cinematic video platform connecting showrooms with certified professional videographers across the region.
              </p>
              <span className="block text-xs font-bold text-yellow-500/75 uppercase tracking-widest pt-2">
                YOUR SHOWROOM. OUR LENS. LIMITLESS IMPACT.
              </span>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#problem"      className="hover:text-yellow-500 transition-colors">Why It Matters</a></li>
                <li><a href="#services"     className="hover:text-yellow-500 transition-colors">What We Offer</a></li>
                <li><a href="#how-it-works" className="hover:text-yellow-500 transition-colors">How It Works</a></li>
                <li><a href="#benefits"     className="hover:text-yellow-500 transition-colors">Benefits</a></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Get Started</h4>
              <p className="text-sm text-gray-400">Ready to showcase your showroom with cinematic quality video content?</p>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 text-black text-xs font-black uppercase rounded-xl tracking-wider hover:bg-yellow-400 transition-colors">
                  Register Your Showroom <ArrowRight size={14}/>
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-xl tracking-wider hover:bg-white/10 transition-colors">
                  Member Login
                </Link>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-900/50 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <span>&copy; {new Date().getFullYear()} Revora Cinematic. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-yellow-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-yellow-500 transition-colors">Privacy Policy</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
