import type { ReactNode } from "react";
import type { CertificateData, CertificateFormat } from "./data";

const C = {
  bg: "#07080b",
  ink: "#e6edf3",
  muted: "#8b97a8",
  line: "rgba(230, 237, 243, 0.22)",
  ecto: "#7cffb2",
};

const LABEL = { fontFamily: "Inter", fontSize: 13, letterSpacing: 3, color: C.muted, textTransform: "uppercase" as const };

function Corner({ rotate, style }: { rotate: number; style: Record<string, number> }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: "absolute", transform: `rotate(${rotate}deg)`, ...style }}>
      <path d="M4 60 V20 Q4 4 20 4 H60" fill="none" stroke={C.muted} strokeWidth="1.5" opacity="0.7" />
      <path d="M12 60 V26 Q12 12 26 12 H60" fill="none" stroke={C.muted} strokeWidth="1" opacity="0.4" />
      <circle cx="20" cy="20" r="3" fill={C.ecto} opacity="0.6" />
    </svg>
  );
}

function Watermark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: "absolute", opacity: 0.05 }}>
      <path d="M50 190 V80 Q50 20 100 20 Q150 20 150 80 V190 Z" fill="none" stroke={C.ink} strokeWidth="4" />
      <path d="M100 55 V115 M78 75 H122" stroke={C.ink} strokeWidth="5" />
      <path d="M20 190 H180" stroke={C.ink} strokeWidth="4" />
    </svg>
  );
}

function Frame({ format, children }: { format: CertificateFormat; children: ReactNode }) {
  const pad = format === "square" ? 36 : 26;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: pad,
        backgroundColor: C.bg,
        backgroundImage:
          "radial-gradient(circle at 15% 0%, rgba(124,255,178,0.09), transparent 45%), radial-gradient(circle at 100% 100%, rgba(120,150,255,0.07), transparent 50%), linear-gradient(160deg, #11141b 0%, #090a0e 60%, #07080b 100%)",
      }}
    >
      <div style={{ flex: 1, display: "flex", border: `1px solid ${C.line}`, padding: 6, position: "relative" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${C.line}`,
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Watermark size={format === "square" ? 760 : 520} />
          <Corner rotate={0} style={{ top: 6, left: 6 }} />
          <Corner rotate={90} style={{ top: 6, right: 6 }} />
          <Corner rotate={180} style={{ bottom: 6, right: 6 }} />
          <Corner rotate={270} style={{ bottom: 6, left: 6 }} />
          {children}
        </div>
      </div>
    </div>
  );
}

function Header({ format }: { format: CertificateFormat }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: format === "square" ? 48 : 40, letterSpacing: 10, color: C.ink }}>
        CERTIFICATE OF DEATH
      </div>
      <div style={{ ...LABEL, fontSize: 13, letterSpacing: 2.5, marginTop: 6, textTransform: "none" }}>
        Issued by the Undead Office of Abandoned Projects
      </div>
    </div>
  );
}

function Field({ label, children, grow = false }: { label: string; children: ReactNode; grow?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: grow ? 1 : 0, flexBasis: grow ? 0 : "auto", minWidth: 0 }}>
      <div style={LABEL}>{label}</div>
      <div style={{ display: "flex", marginTop: 4, borderBottom: `1px dashed ${C.line}`, paddingBottom: 6 }}>{children}</div>
    </div>
  );
}

function Value({ children, size, font = "Inter", italic = false, color = C.ink }: { children: ReactNode; size: number; font?: string; italic?: boolean; color?: string }) {
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontStyle: italic ? "italic" : "normal",
        fontWeight: font === "Fraunces" && !italic ? 600 : italic ? 400 : 500,
        color,
        lineHeight: 1.25,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Seal({ score, size }: { score: number; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        border: `3px solid ${C.ecto}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(-12deg)",
        boxShadow: "0 0 36px rgba(124,255,178,0.25)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size - 18,
          height: size - 18,
          borderRadius: size,
          border: `1px dashed rgba(124,255,178,0.6)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "Inter", fontSize: size * 0.085, letterSpacing: 2, color: C.ecto }}>REVIVAL ODDS</div>
        <div style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: size * 0.3, color: C.ecto, lineHeight: 1 }}>{`${score}%`}</div>
      </div>
    </div>
  );
}

function nameSize(name: string, square: boolean): number {
  const base = square ? 46 : 38;
  if (name.length > 40) return base - 12;
  if (name.length > 28) return base - 6;
  return base;
}

export function CertificateCard({ data, format }: { data: CertificateData; format: CertificateFormat }) {
  const square = format === "square";
  const gap = square ? 26 : 14;
  return (
    <Frame format={format}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: square ? "64px 64px 48px" : "34px 56px 26px" }}>
        <Header format={format} />
        <div style={{ display: "flex", flexDirection: "column", gap, marginTop: square ? 44 : 20 }}>
          <Field label="Deceased">
            <Value size={nameSize(data.deceased, square)} font="Fraunces">{data.deceased}</Value>
          </Field>
          <div style={{ display: "flex", gap: 28 }}>
            <Field label="Born" grow><Value size={square ? 24 : 20}>{data.born}</Value></Field>
            <Field label="Died" grow><Value size={square ? 24 : 20}>{data.died}</Value></Field>
            <Field label="Age at death" grow><Value size={square ? 24 : 20}>{data.ageAtDeath}</Value></Field>
          </div>
          <Field label="Cause of death">
            <Value size={square ? 32 : 24} font="Fraunces">{data.cause}</Value>
          </Field>
          <Field label="Last words">
            <Value size={square ? 22 : 18} font="JetBrains Mono" color={data.lastWords ? C.ink : C.muted}>
              {data.lastWords ? `“${data.lastWords}”` : "None recorded."}
            </Value>
          </Field>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginTop: gap }}>
          <div style={{ display: "flex", flexDirection: "column", gap: square ? 18 : 8, minWidth: 0, flex: 1 }}>
            <Field label="Survived by"><Value size={square ? 22 : 18}>{data.survivedBy}</Value></Field>
            <Value size={square ? 24 : 19} font="Fraunces" italic color={C.ink}>{data.epitaph}</Value>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: square ? 16 : 13, color: C.muted, letterSpacing: 1 }}>{data.domain}</div>
          </div>
          <div style={{ display: "flex", marginRight: square ? 8 : 18, marginBottom: square ? 8 : 10 }}>
            <Seal score={data.score} size={square ? 200 : 140} />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/** Branded card for the home page and for anything that fails. Never a broken image. */
export function FallbackCard({ format, domain, subtitle }: { format: CertificateFormat; domain: string; subtitle: string }) {
  const square = format === "square";
  return (
    <Frame format={format}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: square ? 28 : 16 }}>
        <Header format={format} />
        <div style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: square ? 150 : 120, color: C.ink, letterSpacing: -2, lineHeight: 1, marginTop: square ? 40 : 18 }}>
          Undead
        </div>
        <div style={{ fontFamily: "Fraunces", fontStyle: "italic", fontSize: square ? 36 : 30, color: C.muted }}>
          Your dead projects rise at midnight.
        </div>
        <div style={{ fontFamily: "Inter", fontSize: square ? 22 : 18, color: C.ecto, marginTop: square ? 24 : 10 }}>{subtitle}</div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: square ? 18 : 14, color: C.muted, letterSpacing: 1 }}>{domain}</div>
      </div>
    </Frame>
  );
}
