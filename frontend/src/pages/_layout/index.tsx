import Header from "@/pages/_layout/header";
import Sidebar from "@/pages/_layout/sidebar";
import PermissionDeniedDialog from "@/components/PermissionDeniedDialog";

import {
  Sparkles,
  Stars,
  Atom,
  Orbit,
  Hexagon,
  Bot,
  Zap,
  CircleDashed
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PermissionDeniedDialog />

      <div className="bg-primary min-h-screen flex flex-col relative overflow-hidden">
        {/* =========================
            HEADER DECORATIONS
        ========================= */}

        <Sparkles
          size={14}
          className="absolute top-4 left-8 text-white/20 animate-pulse pointer-events-none"
        />

        <Stars
          size={12}
          className="absolute top-8 left-1/4 text-white/15 animate-pulse pointer-events-none"
          style={{ animationDelay: "1s" }}
        />

        <CircleDashed
          size={14}
          className="absolute top-3 left-1/2 text-white/15 animate-pulse pointer-events-none"
          style={{ animationDelay: "2s" }}
        />

        <Orbit
          size={16}
          className="absolute top-4 right-1/4 text-white/20 animate-pulse pointer-events-none"
          style={{ animationDelay: "3s" }}
        />

        <Zap
          size={12}
          className="absolute top-5 right-10 text-white/20 animate-pulse pointer-events-none"
          style={{ animationDelay: "4s" }}
        />

        {/* =========================
            SIDEBAR DECORATIONS
        ========================= */}

        <Atom
          size={16}
          className="absolute top-32 left-1 text-white/20 animate-pulse pointer-events-none"
          style={{ animationDelay: "3s" }}
        />

        <Sparkles
          size={16}
          className="absolute top-52 left-20 text-white/15 animate-pulse pointer-events-none"
          style={{ animationDelay: "1.5s" }}
        />

        <Hexagon
          size={18}
          className="absolute top-80 left-52 text-white/15 animate-pulse pointer-events-none"
          style={{ animationDelay: "2.5s" }}
        />

        <Stars
          size={14}
          className="absolute top-[28rem] left-28 text-white/20 animate-pulse pointer-events-none"
          style={{ animationDelay: "3.5s" }}
        />

        <Bot
          size={18}
          className="absolute bottom-52 left-8 text-white/15 animate-pulse pointer-events-none"
          style={{ animationDelay: "4.5s" }}
        />

        <Orbit
          size={20}
          className="absolute bottom-32 left-20 text-white/20 animate-pulse pointer-events-none"
          style={{ animationDelay: "5.5s" }}
        />

        <CircleDashed
          size={16}
          className="absolute bottom-16 left-10 text-white/15 animate-pulse pointer-events-none"
          style={{ animationDelay: "6.5s" }}
        />

        {/* =========================
            LAYOUT
        ========================= */}

        <Header className="w-full flex justify-between h-16 min-h-[64px] max-h-[64px]" />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            className="
              md:w-72
              lg:w-64
              w-full
              h-[calc(100vh-64px)]
              text-xs
              bg-primary
              text-white
              overflow-hidden
            "
          />

          <main className="min-w-0 flex-1 overflow-hidden rounded-tl-[40px] bg-white md:rounded-tl-[32px]">
            <div className="scroll-smooth w-full min-h-[calc(100lvh-64px)] max-h-[calc(100lvh-64px)] overflow-y-auto overflow-x-hidden">
              {/* Top spacer */}
              <div className="h-6 bg-white" />

              <div className="flex min-w-0">
                {/* Left spacer */}
                <div className="w-4 shrink-0 bg-white md:w-8" />

                {/* Content */}
                <div className="min-w-0 flex-1">{children}</div>
              </div>

              {/* Bottom spacer */}
              <div className="h-32 bg-white md:h-6" />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
