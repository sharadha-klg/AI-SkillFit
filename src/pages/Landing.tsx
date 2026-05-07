import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";
import {
  Briefcase, UserCircle2, Sparkles, ArrowRight, Menu, X,
  Lock, Users, BarChart3, UserPlus, ShieldCheck, ClipboardList, FileBarChart, Target,
  CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const HERO_HLS = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";
const ACCENT = "#72C6EF";
const ACCENT_DEEP = "#004E8F";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"candidate" | "admin">("candidate");
  const [mobileOpen, setMobileOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HERO_HLS;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.loadSource(HERO_HLS);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, []);

  const candidateSteps = [
    { icon: UserPlus, title: t("hiw.c1t"), desc: t("hiw.c1d") },
    { icon: ShieldCheck, title: t("hiw.c2t"), desc: t("hiw.c2d") },
    { icon: ClipboardList, title: t("hiw.c3t"), desc: t("hiw.c3d") },
    { icon: FileBarChart, title: t("hiw.c4t"), desc: t("hiw.c4d") },
    { icon: Target, title: t("hiw.c5t"), desc: t("hiw.c5d") },
  ];
  const adminSteps = [
    { icon: UserPlus, title: t("hiw.a1t"), desc: t("hiw.a1d") },
    { icon: ShieldCheck, title: t("hiw.a2t"), desc: t("hiw.a2d") },
    { icon: BarChart3, title: t("hiw.a3t"), desc: t("hiw.a3d") },
    { icon: Users, title: t("hiw.a4t"), desc: t("hiw.a4d") },
    { icon: FileBarChart, title: t("hiw.a5t"), desc: t("hiw.a5d") },
  ];
  const steps = tab === "candidate" ? candidateSteps : adminSteps;

  const navLinks = [
    { href: "#features", label: t("nav.features") },
    { href: "#how", label: t("nav.how") },
    { href: "#roles", label: t("nav.roles") },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ============ HERO ============ */}
      <section
        className="relative min-h-[78svh] md:min-h-screen w-full overflow-hidden"
        style={{ background: "linear-gradient(to right, #004E8F, #72C6EF)", fontFamily: "Inter, sans-serif" }}
      >
        {/* Video background (HLS) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Left dark gradient + bottom fade */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #070b0a, transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#070b0a] to-transparent" />

        {/* Vertical grid lines (desktop only) */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none">
          <div className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: "25%" }} />
          <div className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: "50%" }} />
          <div className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: "75%" }} />
        </div>

        {/* Top-center soft glow (SVG ellipse) */}
        <svg
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          width="1100"
          height="500"
          viewBox="0 0 1100 500"
          aria-hidden
        >
          <defs>
            <filter id="heroBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="25" />
            </filter>
          </defs>
          <ellipse cx="550" cy="120" rx="420" ry="100" fill={ACCENT} fillOpacity="0.45" filter="url(#heroBlur)" />
          <ellipse cx="550" cy="140" rx="280" ry="60" fill="#5ed29c" fillOpacity="0.25" filter="url(#heroBlur)" />
        </svg>

        {/* Header */}
        <header className="relative z-30">
          <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, #5ed29c, ${ACCENT})` }}
              >
                <Sparkles className="w-5 h-5" style={{ color: "#070b0a" }} />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-white/60">
                  {t("nav.tagline")}
                </div>
                <span className="text-base font-bold text-white">{t("brand")}</span>
              </div>
            </div>

            <div
              className="hidden md:flex items-center gap-8 text-[16px] text-white/80"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="transition-colors hover:text-[#5ed29c] uppercase tracking-wide text-sm"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </header>

        {/* Mobile fullscreen menu */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-[#070b0a]/95 backdrop-blur-xl animate-fade-up md:hidden">
            <div className="flex items-center justify-between px-6 py-6">
              <span className="text-base font-bold text-white">{t("brand")}</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-8 mt-20 text-2xl font-semibold">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-white/80 hover:text-[#5ed29c] uppercase"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Hero center content */}
        <div className="relative z-20 container mx-auto px-6 flex flex-col items-center justify-center text-center pt-12 md:pt-20 pb-8 md:pb-14 min-h-[78svh] md:min-h-screen">
          {/* Eyebrow */}
          <div
            className="uppercase animate-fade-up"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#5ed29c",
              letterSpacing: "0.18em",
            }}
          >
            {t("nav.tagline")} — {t("landing.badge")}
          </div>

          {/* Main headline */}
          <h1
            className="mt-4 uppercase text-white animate-fade-up"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              fontSize: "clamp(40px, 7vw, 72px)",
              maxWidth: "960px",
            }}
          >
            {t("landing.title1")} {t("landing.title2")}
            <span style={{ color: "#5ed29c" }}>.</span>
          </h1>

          {/* Description */}
          <p
            className="mt-3 animate-fade-up"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.7)",
              maxWidth: "512px",
            }}
          >
            {t("landing.subtitle")}
          </p>
        </div>
      </section>

      {/* ============ ROLES ============ */}
      <section id="roles" className="container mx-auto px-6 py-8 md:py-12 -mt-4 md:-mt-6 relative z-30">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("nav.roles")}</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/auth?role=candidate")}
            className="glass-card rounded-2xl p-6 text-left hover:scale-[1.02] transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:glow transition-smooth">
              <UserCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("landing.candidate")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("landing.candidateDesc")}</p>
            <span className="text-primary font-medium text-sm">
              {t("landing.continueCandidate")} →
            </span>
          </button>
          <button
            onClick={() => navigate("/auth?role=admin")}
            className="glass-card rounded-2xl p-6 text-left hover:scale-[1.02] transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:glow transition-smooth">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("landing.admin")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("landing.adminDesc")}</p>
            <span className="text-primary font-medium text-sm">{t("landing.continueAdmin")} →</span>
          </button>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="container mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("nav.features")}</h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            { icon: Lock, title: t("feat.f1t"), desc: t("feat.f1d") },
            { icon: Users, title: t("feat.f2t"), desc: t("feat.f2d") },
            { icon: BarChart3, title: t("feat.f3t"), desc: t("feat.f3d") },
          ].map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <f.icon className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="container mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-[11px] uppercase tracking-wider text-primary mb-3">
            {t("hiw.kicker")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{t("hiw.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("hiw.subtitle")}</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="glass-card rounded-full p-1 inline-flex">
            <button
              onClick={() => setTab("candidate")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-smooth ${
                tab === "candidate" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t("hiw.forCandidates")}
            </button>
            <button
              onClick={() => setTab("admin")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-smooth ${
                tab === "admin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t("hiw.forAdmins")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-primary font-mono mb-2">0{i + 1}</div>
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3 glow">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="glass-card rounded-xl p-3">
                <h4 className="font-semibold text-sm mb-1">{s.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {tab === "candidate" && (
          <div className="max-w-4xl mx-auto mt-12 glass-card rounded-2xl p-6">
            <h3 className="text-center font-semibold mb-4">{t("hiw.outcomeTitle")}</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="glass-card rounded-xl p-3 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{t("hiw.o1t")}</div>
                  <div className="text-xs text-muted-foreground">{t("hiw.o1d")}</div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{t("hiw.o2t")}</div>
                  <div className="text-xs text-muted-foreground">{t("hiw.o2d")}</div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-3 flex items-start gap-2">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{t("hiw.o3t")}</div>
                  <div className="text-xs text-muted-foreground">{t("hiw.o3d")}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          <span className="font-semibold">{t("hiw.secure")}</span>
          <span>— {t("hiw.secureDesc")}</span>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground border-t border-border">
        {t("landing.footer")}
      </footer>
    </div>
  );
};

export default Landing;
