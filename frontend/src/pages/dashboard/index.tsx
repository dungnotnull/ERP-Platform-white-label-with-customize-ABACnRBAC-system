import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useUserProfile } from "@/shared/hooks/useUserProfile";
import { useTranslation } from "react-i18next";
import { getHours } from "date-fns";
import {
  Mail,
  Shield,
  Sparkles,
  BarChart3,
  MonitorSmartphone,
  Users,
  ArrowRight,
  Boxes,
  Fingerprint
} from "lucide-react";
import { LoadingOverlay } from "@/components/common/LoadingSpinner";
import WeatherSection from "@/components/creative/WeatherUtil";
import i18n from "@/lib/i18n/i18n";
import AgentHotspotWrapper from "@/components/creative/agentspot/AgentHotspotWrapper";

function getGreeting(): string {
  const hour = getHours(new Date());
  if (hour >= 5 && hour < 12) return "dashboard.home.morning";
  if (hour >= 12 && hour < 17) return "dashboard.home.afternoon";
  if (hour >= 17 && hour < 21) return "dashboard.home.evening";
  return "dashboard.home.night";
}

function PolaroidParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0,
      h = 0;
    const resize = () => {
      const el = canvas.parentElement;
      if (!el) return;
      w = canvas.width = el.offsetWidth * (window.devicePixelRatio || 1);
      h = canvas.height = el.offsetHeight * (window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.004,
      vy: (Math.random() - 0.5) * 0.004,
      r: Math.random() * 3 + 1,
      alpha: Math.random() * 0.4 + 0.1,
      da: (Math.random() - 0.5) * 0.003,
      hue: Math.random() * 60 + 210
    }));

    let stopped = false;
    let animId = 0;

    const animate = () => {
      if (!inView) {
        if (!stopped) {
          ctx.clearRect(0, 0, w, h);
          stopped = true;
        }
        animId = requestAnimationFrame(animate);
        return;
      }
      stopped = false;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.da;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        if (p.alpha <= 0.05 || p.alpha >= 0.5) p.da *= -1;

        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [inView]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

function FloatingShapes3D() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden
    >
      <div
        className="gpu-anim absolute w-32 h-32 md:w-44 md:h-44 rounded-2xl opacity-[0.07]"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          top: "10%",
          left: "5%",
          transform: "rotate3d(1, 1, 0, 45deg)",
          animation: "float3d-1 12s ease-in-out infinite"
        }}
      />
      <div
        className="gpu-anim absolute w-24 h-24 md:w-36 md:h-36 opacity-[0.06]"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          top: "60%",
          right: "8%",
          transform: "rotate3d(0, 1, 1, 30deg)",
          animation: "float3d-2 10s ease-in-out infinite"
        }}
      />
      <div
        className="gpu-anim absolute w-28 h-28 md:w-40 md:h-40 rounded-full opacity-[0.05]"
        style={{
          border: "3px solid #a78bfa",
          top: "40%",
          left: "65%",
          transform: "rotate3d(1, 0, 1, 60deg)",
          animation: "float3d-3 14s ease-in-out infinite"
        }}
      />
      <div
        className="gpu-anim absolute w-20 h-20 md:w-28 md:h-28 opacity-[0.06]"
        style={{
          background: "linear-gradient(135deg, #ec4899, #f43f5e)",
          clipPath:
            "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          bottom: "15%",
          left: "30%",
          transform: "rotate3d(1, 1, 1, 20deg)",
          animation: "float3d-4 11s ease-in-out infinite"
        }}
      />
      <div
        className="gpu-anim absolute w-16 h-16 md:w-20 md:h-20 opacity-[0.07]"
        style={{
          background: "linear-gradient(135deg, #14b8a6, #0ea5e9)",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          top: "20%",
          right: "25%",
          transform: "rotate3d(0, 0, 1, 40deg)",
          animation: "float3d-5 9s ease-in-out infinite"
        }}
      />
    </div>
  );
}

function TimeBasedGreeting() {
  const { t } = useTranslation();
  const greetingKey = getGreeting();

  const now = new Date();
  // const timeStr = format(now, "HH:mm", { locale: enGB });
  // const dateStr = format(now, "EEEE, dd MMMM yyyy", { locale: enGB });

  const timeStr = new Intl.DateTimeFormat(i18n.language, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);

  const dateStr = new Intl.DateTimeFormat(i18n.language, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(now);

  return (
    <div className="text-center md:text-left">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-4 border border-white/10">
        <Sparkles className="h-3 w-3 text-amber-300" />
        <span>{timeStr}</span>
        <span className="text-white/30">·</span>
        <span>{dateStr}</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
        {t(greetingKey)}
        <span className="text-amber-300">.</span>
      </h1>
      <p className="text-blue-100/80 mt-3 text-sm md:text-base max-w-md">
        {t("dashboard.home.subtitle")}
      </p>
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useUserProfile();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingOverlay />
      </div>
    );
  }

  const displayName = user?.name || user?.email || user?._id;

  return (
    <>
      <style>{`
        @keyframes float3d-1 {
          0%,100%{transform:rotate3d(1,1,0,45deg) translate(0,0)}
          25%{transform:rotate3d(1,1,0,50deg) translate(15px,-20px)}
          50%{transform:rotate3d(1,1,0,40deg) translate(-10px,15px)}
          75%{transform:rotate3d(1,1,0,55deg) translate(10px,-10px)}
        }
        @keyframes float3d-2 {
          0%,100%{transform:rotate3d(0,1,1,30deg) translate(0,0)}
          33%{transform:rotate3d(0,1,1,25deg) translate(-20px,-10px)}
          66%{transform:rotate3d(0,1,1,35deg) translate(15px,20px)}
        }
        @keyframes float3d-3 {
          0%,100%{transform:rotate3d(1,0,1,60deg) translate(0,0) scale(1)}
          50%{transform:rotate3d(1,0,1,70deg) translate(-10px,-25px) scale(1.1)}
        }
        @keyframes float3d-4 {
          0%,100%{transform:rotate3d(1,1,1,20deg) translate(0,0)}
          40%{transform:rotate3d(1,1,1,30deg) translate(25px,15px)}
          80%{transform:rotate3d(1,1,1,15deg) translate(-15px,-20px)}
        }
        @keyframes float3d-5 {
          0%,100%{transform:rotate3d(0,0,1,40deg) translate(0,0)}
          50%{transform:rotate3d(0,0,1,50deg) translate(-20px,10px)}
        }
        @keyframes pulseGlow {
          0%,100%{box-shadow:0 0 20px rgba(99,102,241,.15),0 0 60px rgba(99,102,241,.05)}
          50%{box-shadow:0 0 30px rgba(99,102,241,.25),0 0 80px rgba(99,102,241,.1)}
        }
        @keyframes fadeInUp {
          from{opacity:0;transform:translateY(24px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn {
          from{opacity:0}to{opacity:1}
        }
        .afiu{animation:fadeInUp .6s ease-out both}
        .afi{animation:fadeIn .5s ease-out both}
        .ad1{animation-delay:.1s}
        .ad2{animation-delay:.2s}
        .ad3{animation-delay:.3s}
        .ad4{animation-delay:.4s}
        .cva{content-visibility:auto;contain-intrinsic-size:auto 500px}
        .gpu-anim{will-change:transform,opacity}
      `}</style>

      <div className="pr-5 md:pr-[50px] md:pl-0">
        {/* ─── Hero Banner ─── */}
        <div className="relative rounded-3xl overflow-hidden mb-8 md:mb-12">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #1e3a5f 100%)"
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 20% 50%, #818cf8 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #38bdf8 0%, transparent 40%)"
            }}
          />
          <FloatingShapes3D />
          <PolaroidParticleCanvas />

          <div className="relative z-10 px-6 py-10 md:px-12 md:py-16 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <TimeBasedGreeting />
            <div
              className="flex-shrink-0 bg-white/10 rounded-2xl p-5 border border-white/15 w-full md:w-72"
              style={{ animation: "pulseGlow 4s ease-in-out infinite" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Avatar className="h-12 w-12 text-white">
                    <AvatarImage src={user?.profilePicture || undefined} />
                    <AvatarFallback className="text-2xl font-bold text-white bg-slate-400">
                      {user?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {displayName || t("dashboard.home.user")}
                  </p>
                  {user?.email && (
                    <p className="text-blue-200/70 text-xs truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              {user?.isSuperadmin && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-purple-200">
                  <Shield className="h-3.5 w-3.5" />
                  {t("dashboard.home.superadmin")}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <AgentHotspotWrapper />
        </div>

        <div className="mb-14 mt-10">
          <div className="text-xl md:text-2xl font-extrabold text-blue-800 leading-tight tracking-tight mb-4">
            {t("dashboard.home.relaxTitle")}
          </div>
          <WeatherSection />
          {/* <WorldNewsSection/> */}
        </div>

        {/* <div className="cva mb-6">
          <ResourceHubAnimationV2/>
        </div> */}

        {/* ─── Features Introduction ─── */}
        <div className="cva mb-10">
          <div className="afi text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold border border-indigo-100 mb-3">
              <Boxes className="h-3 w-3" />
              {t("dashboard.home.featuresTag")}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              {t("dashboard.home.featuresTitle")}
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              {t("dashboard.home.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="afiu ad1 group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none"
                style={{ background: "#6366f1" }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors duration-200">
                    {t("dashboard.home.feature1Title")}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("dashboard.home.feature1Desc")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="afiu ad2 group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #06b6d4)"
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none"
                style={{ background: "#3b82f6" }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                  <MonitorSmartphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors duration-200">
                    {t("dashboard.home.feature2Title")}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("dashboard.home.feature2Desc")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="afiu ad3 group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, #10b981, #14b8a6)"
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none"
                style={{ background: "#10b981" }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors duration-200">
                    {t("dashboard.home.feature3Title")}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("dashboard.home.feature3Desc")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="afiu ad4 group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #f97316)"
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none"
                style={{ background: "#f59e0b" }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-amber-700 transition-colors duration-200">
                    {t("dashboard.home.feature4Title")}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("dashboard.home.feature4Desc")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          {t("dashboard.home.loggedInAs")}: {user?.email || user?._id}
        </p>
      </div>
    </>
  );
}
