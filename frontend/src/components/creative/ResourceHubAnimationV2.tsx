import { useTranslation } from "react-i18next";

const CSS = `
.rh-root {
  font-family: system-ui, -apple-system, sans-serif;
  background: transparent;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 40px 0;
}

/* ── dot-grid ── */
.rh-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 48%, black 35%, transparent 95%);
  pointer-events: none;
}

/* ── ambient radial glow ── */
.rh-ambient {
  position: absolute;
  width: 780px;
  height: 780px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(99,102,241,0.08) 0%,
    rgba(236,72,153,0.05) 38%,
    transparent 68%
  );
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ══ STAGE ══ */
.rh-stage {
  position: relative;
  width: 540px;
  height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── orbit rings ── */
.rh-ring {
  position: absolute;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: rh-ring-breathe 5s ease-in-out infinite;
  pointer-events: none;
}
.rh-ring-a {
  width: 268px; height: 268px;
  margin: -134px 0 0 -134px;
  border: 1px solid rgba(99,102,241,0.35);
  animation-delay: 0s;
}
.rh-ring-b {
  width: 380px; height: 380px;
  margin: -190px 0 0 -190px;
  border: 1px solid rgba(236,72,153,0.22);
  animation-delay: 1.4s;
}
.rh-ring-c {
  width: 502px; height: 502px;
  margin: -251px 0 0 -251px;
  border: 1px solid rgba(99,102,241,0.15);
  animation-delay: 2.8s;
}

@keyframes rh-ring-breathe {
  0%,100% { opacity: 0.6; }
  50%      { opacity: 1.0; }
}

/* ══ 3D CUBE ══ */
.rh-scene {
  perspective: 820px;
  perspective-origin: 50% 42%;
  flex-shrink: 0;
}

.rh-cube {
  width: 154px;
  height: 154px;
  transform-style: preserve-3d;
  animation: rh-spin 13s linear infinite;
  position: relative;
}

@keyframes rh-spin {
  from { transform: rotateX(-24deg) rotateY(0deg); }
  to   { transform: rotateX(-24deg) rotateY(360deg); }
}

.rh-face {
  position: absolute;
  width: 154px;
  height: 154px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.18);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(99,102,241,0.12);
}

.rh-face::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 55%);
  pointer-events: none;
  z-index: 1;
}

.rh-face-front {
  transform: translateZ(77px);
  background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 8px 40px rgba(99,102,241,0.3);
}
.rh-face-back {
  transform: rotateY(180deg) translateZ(77px);
  background: linear-gradient(145deg, #06b6d4 0%, #10b981 100%);
  box-shadow: 0 8px 40px rgba(6,182,212,0.25);
}
.rh-face-left {
  transform: rotateY(-90deg) translateZ(77px);
  background: linear-gradient(145deg, #ec4899 0%, #f43f5e 100%);
  box-shadow: 0 8px 40px rgba(236,72,153,0.25);
}
.rh-face-right {
  transform: rotateY(90deg) translateZ(77px);
  background: linear-gradient(145deg, #f59e0b 0%, #f97316 100%);
  box-shadow: 0 8px 40px rgba(245,158,11,0.25);
}
.rh-face-top {
  transform: rotateX(90deg) translateZ(77px);
  background: linear-gradient(145deg, #3b82f6 0%, #6366f1 100%);
  box-shadow: 0 8px 40px rgba(59,130,246,0.25);
}
.rh-face-bottom {
  transform: rotateX(-90deg) translateZ(77px);
  background: linear-gradient(145deg, #1e1b4b 0%, #312e81 100%);
  box-shadow: 0 8px 40px rgba(30,27,75,0.3);
}

.rh-face-svg {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.15));
  opacity: 0.95;
}

/* ══ CONNECTOR LINES ══ */
.rh-connectors {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* ══ FLOATING CHIPS ══ */
.rh-chip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px 9px 10px;
  border-radius: 16px;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  white-space: nowrap;
  z-index: 10;
}

.rh-chip-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rh-chip-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rh-chip-label {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  opacity: 0.95;
}

.rh-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.rh-dot-pulse {
  animation: rh-dot-pulse 2.4s ease-in-out infinite;
}

@keyframes rh-dot-pulse {
  0%,100% { transform: scale(1);   opacity: 1.0; }
  50%      { transform: scale(1.5); opacity: 0.5; }
}

.rh-chip-1 {
  top: 70px; left: 4px;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.35);
  color: #3730a3;
  animation: rh-float-1 6.8s ease-in-out infinite;
  animation-delay: 0s;
}
.rh-chip-2 {
  top: 96px; right: 4px;
  background: rgba(6,182,212,0.1);
  border: 1px solid rgba(6,182,212,0.3);
  color: #0e7490;
  animation: rh-float-2 7.4s ease-in-out infinite;
  animation-delay: 0.9s;
}
.rh-chip-3 {
  top: 18px; left: 50%; margin-left: -72px;
  background: rgba(245,158,11,0.12);
  border: 1px solid rgba(245,158,11,0.35);
  color: #92400e;
  animation: rh-float-3 5.8s ease-in-out infinite;
  animation-delay: 1.7s;
}
.rh-chip-4 {
  bottom: 54px; left: 50%; margin-left: -68px;
  background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.35);
  color: #5b21b6;
  animation: rh-float-4 8.2s ease-in-out infinite;
  animation-delay: 2.5s;
}
.rh-chip-5 {
  top: 28px; right: 16px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  color: #065f46;
  animation: rh-float-5 6.2s ease-in-out infinite;
  animation-delay: 0.5s;
}
.rh-chip-6 {
  bottom: 72px; left: 16px;
  background: rgba(244,63,94,0.1);
  border: 1px solid rgba(244,63,94,0.3);
  color: #9f1239;
  animation: rh-float-6 7.9s ease-in-out infinite;
  animation-delay: 1.3s;
}

@keyframes rh-float-1 {
  0%   { transform: translate(0px, 0px); opacity: 0; }
  14%  { opacity: 1; }
  50%  { transform: translate(10px,-20px); opacity: 1; }
  86%  { opacity: 1; }
  100% { transform: translate(0px, 0px); opacity: 0; }
}
@keyframes rh-float-2 {
  0%   { transform: translate(0px, 0px); opacity: 0; }
  14%  { opacity: 1; }
  50%  { transform: translate(-12px,-18px); opacity: 1; }
  86%  { opacity: 1; }
  100% { transform: translate(0px, 0px); opacity: 0; }
}
@keyframes rh-float-3 {
  0%   { transform: translateY(0px) scale(0.92); opacity: 0; }
  14%  { opacity: 1; }
  50%  { transform: translateY(-16px) scale(1.0); opacity: 1; }
  86%  { opacity: 1; }
  100% { transform: translateY(0px) scale(0.92); opacity: 0; }
}
@keyframes rh-float-4 {
  0%   { transform: translate(0px, 0px); opacity: 0; }
  14%  { opacity: 1; }
  50%  { transform: translate(-8px, 14px); opacity: 1; }
  86%  { opacity: 1; }
  100% { transform: translate(0px, 0px); opacity: 0; }
}
@keyframes rh-float-5 {
  0%   { transform: translate(0px, 0px); opacity: 0; }
  14%  { opacity: 1; }
  50%  { transform: translate(-16px,-22px); opacity: 1; }
  86%  { opacity: 1; }
  100% { transform: translate(0px, 0px); opacity: 0; }
}
@keyframes rh-float-6 {
  0%   { transform: translate(0px, 0px); opacity: 0; }
  14%  { opacity: 1; }
  50%  { transform: translate(14px, 12px); opacity: 1; }
  86%  { opacity: 1; }
  100% { transform: translate(0px, 0px); opacity: 0; }
}

/* ══ PARTICLES ══ */
.rh-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.rh-p {
  position: absolute;
  border-radius: 50%;
  animation: rh-p-rise linear infinite;
}
@keyframes rh-p-rise {
  0%   { transform: translateY(0px) scale(1.0); opacity: 0;   }
  12%  { opacity: 0.7; }
  88%  { opacity: 0.3; }
  100% { transform: translateY(-160px) scale(0.4); opacity: 0; }
}

/* ══ TEXT ══ */
.rh-text {
  margin-top: 44px;
  text-align: center;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}
.rh-title {
  // font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.055em;
  line-height: 1;
  background: linear-gradient(128deg, #6366f1 0%, #ec4899 55%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.rh-tagline {
  margin-top: 11px;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(99,102,241,0.55);
}
.rh-pills {
  margin-top: 22px;
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.rh-pill {
  padding: 5px 14px;
  border-radius: 100px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(99,102,241,0.3);
  color: rgba(99,102,241,0.75);
  background: rgba(99,102,241,0.07);
}
`;

const ICONS = {
  employee:
    "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  department:
    "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
  equipment:
    "M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z",
  supplier:
    "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  permission:
    "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
  logs: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  budget:
    "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  task: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
};

const FACES = [
  { cls: "rh-face-front", icon: "employee", color: "#ffffff" },
  { cls: "rh-face-back", icon: "department", color: "#ffffff" },
  { cls: "rh-face-left", icon: "equipment", color: "#ffffff" },
  { cls: "rh-face-right", icon: "permission", color: "#ffffff" },
  { cls: "rh-face-top", icon: "task", color: "#ffffff" },
  { cls: "rh-face-bottom", icon: "budget", color: "#e2e8f0" }
];

const PARTICLES = [
  {
    left: "14%",
    top: "72%",
    size: 3,
    color: "#6366f1",
    dur: "5.2s",
    delay: "0s"
  },
  {
    left: "23%",
    top: "80%",
    size: 2,
    color: "#ec4899",
    dur: "6.8s",
    delay: "1.1s"
  },
  {
    left: "36%",
    top: "68%",
    size: 4,
    color: "#f59e0b",
    dur: "4.6s",
    delay: "2.3s"
  },
  {
    left: "50%",
    top: "76%",
    size: 2,
    color: "#8b5cf6",
    dur: "7.1s",
    delay: "0.5s"
  },
  {
    left: "62%",
    top: "82%",
    size: 3,
    color: "#10b981",
    dur: "5.9s",
    delay: "1.8s"
  },
  {
    left: "75%",
    top: "70%",
    size: 2,
    color: "#f43f5e",
    dur: "6.3s",
    delay: "3.0s"
  },
  {
    left: "84%",
    top: "78%",
    size: 3,
    color: "#6366f1",
    dur: "4.9s",
    delay: "0.8s"
  },
  {
    left: "8%",
    top: "85%",
    size: 2,
    color: "#06b6d4",
    dur: "8.0s",
    delay: "2.6s"
  },
  {
    left: "43%",
    top: "88%",
    size: 3,
    color: "#f59e0b",
    dur: "5.5s",
    delay: "1.4s"
  },
  {
    left: "91%",
    top: "75%",
    size: 2,
    color: "#ec4899",
    dur: "6.6s",
    delay: "3.5s"
  }
];

function FaceIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <svg
      className="rh-face-svg"
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d={ICONS[icon as keyof typeof ICONS]} />
    </svg>
  );
}

function ChipIcon({
  icon,
  bg,
  color
}: {
  icon: string;
  bg: string;
  color: string;
}) {
  return (
    <div className="rh-chip-icon" style={{ background: bg }}>
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill={color}
        aria-hidden="true"
      >
        <path d={ICONS[icon as keyof typeof ICONS]} />
      </svg>
    </div>
  );
}

function ConnectorLines() {
  const cx = 270,
    cy = 270;
  const endpoints = [
    { x: 48, y: 112 },
    { x: 468, y: 138 },
    { x: 198, y: 38 },
    { x: 210, y: 448 },
    { x: 448, y: 56 },
    { x: 78, y: 406 }
  ];
  const colors = [
    "#6366f1",
    "#06b6d4",
    "#f59e0b",
    "#8b5cf6",
    "#10b981",
    "#f43f5e"
  ];

  return (
    <svg
      className="rh-connectors"
      viewBox="0 0 540 540"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {endpoints.map((ep, i) => (
        <line
          key={i}
          x1={ep.x}
          y1={ep.y}
          x2={cx}
          y2={cy}
          stroke={colors[i]}
          strokeWidth="1.2"
          strokeDasharray="4 5"
          strokeOpacity="0.35"
          style={{
            animation: `rh-dash-flow ${2.5 + i * 0.3}s linear infinite`
          }}
        />
      ))}
      <style>{`
        @keyframes rh-dash-flow { to { stroke-dashoffset: -18; } }
        .rh-connectors line { stroke-dashoffset: 0; }
      `}</style>
    </svg>
  );
}

export default function ResourceHubAnimationV2() {
  const { t } = useTranslation();

  const CHIPS = [
    {
      cls: "rh-chip-1",
      icon: "employee",
      iconBg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      iconColor: "#ffffff",
      dot: "#6366f1",
      label: t("resourceHub.chipEmployee", "Employee Info")
    },
    {
      cls: "rh-chip-2",
      icon: "department",
      iconBg: "linear-gradient(135deg, #06b6d4, #10b981)",
      iconColor: "#ffffff",
      dot: "#06b6d4",
      label: t("resourceHub.chipDepartment", "Department Info")
    },
    {
      cls: "rh-chip-3",
      icon: "equipment",
      iconBg: "linear-gradient(135deg, #f59e0b, #f97316)",
      iconColor: "#ffffff",
      dot: "#f59e0b",
      label: t("resourceHub.chipEquipment", "Equipment Catalog")
    },
    {
      cls: "rh-chip-4",
      icon: "supplier",
      iconBg: "linear-gradient(135deg, #8b5cf6, #ec4899)",
      iconColor: "#ffffff",
      dot: "#8b5cf6",
      label: t("resourceHub.chipSupplier", "Supplier Directory")
    },
    {
      cls: "rh-chip-5",
      icon: "task",
      iconBg: "linear-gradient(135deg, #10b981, #34d399)",
      iconColor: "#ffffff",
      dot: "#10b981",
      label: t("resourceHub.chipPermissions", "Access Permissions")
    },
    {
      cls: "rh-chip-6",
      icon: "logs",
      iconBg: "linear-gradient(135deg, #f43f5e, #fb7185)",
      iconColor: "#ffffff",
      dot: "#f43f5e",
      label: t("resourceHub.chipLogs", "System Logs")
    }
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="rh-root"
        role="main"
        aria-label="Resource Hub 3D Animation"
      >
        <div className="rh-ambient" aria-hidden="true" />

        <div className="rh-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="rh-p"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDuration: p.dur,
                animationDelay: p.delay,
                opacity: 0
              }}
            />
          ))}
        </div>

        <div className="rh-stage" aria-label="3D rotating resource hub cube">
          <div className="rh-ring rh-ring-a" aria-hidden="true" />
          <div className="rh-ring rh-ring-b" aria-hidden="true" />
          <div className="rh-ring rh-ring-c" aria-hidden="true" />
          <ConnectorLines />

          <div className="rh-scene">
            <div className="rh-cube" aria-hidden="true">
              {FACES.map(f => (
                <div key={f.cls} className={`rh-face ${f.cls}`}>
                  <FaceIcon icon={f.icon} color={f.color} />
                </div>
              ))}
            </div>
          </div>

          {CHIPS.map(c => (
            <div key={c.cls} className={`rh-chip ${c.cls}`}>
              <ChipIcon icon={c.icon} bg={c.iconBg} color={c.iconColor} />
              <div className="rh-chip-body">
                <span className="rh-chip-label">{c.label}</span>
              </div>
              <div
                className="rh-dot rh-dot-pulse"
                style={{ background: c.dot }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        <div className="rh-text">
          <h1 className="rh-title">{t("resourceHub.title", "Resource Hub")}</h1>
          <p className="rh-tagline">
            {t("resourceHub.tagline", "Manage · Unify · Expand")}
          </p>
          {/* <div className="rh-pills" role="list" aria-label="Modules">
            {PILLS.map((p) => (
              <span key={p} className="rh-pill" role="listitem">{p}</span>
            ))}
          </div> */}
        </div>
      </div>
    </>
  );
}
