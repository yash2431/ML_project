"use client";

import { useState, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface PredictResponse {
  prediction: "Fraud" | "Not Fraud";
  confidence: number | null;
}
interface FormData {
  [key: string]: string;
}
interface FieldDef {
  name: string;
  label: string;
  group: string;
  hint: string;
  guidance: string;
}

// ─── API ────────────────────────────────────────────────────────────────────
async function predictFraud(data: FormData): Promise<PredictResponse> {
  const response = await fetch("https://ml-project-two-olive.vercel.app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || `Server error ${response.status}`);
  return json as PredictResponse;
}

// ─── Fields ─────────────────────────────────────────────────────────────────
const FIELDS: FieldDef[] = [
  { name: "claim_number", label: "Claim Number", group: "Claim", hint: "Normalized float (0–1)", guidance: "Scaled claim identifier. Each claim has a unique float value. Example: 0.00037." },
  { name: "claim_date", label: "Claim Date", group: "Claim", hint: "Integer day index (0–682)", guidance: "Day index from dataset start. Range: 0 (earliest) to 682 (latest). Example: 199." },
  { name: "claim_day_of_week", label: "Day of Week", group: "Claim", hint: "0=Sun  1=Mon  2=Tue  3=Wed  4=Thu  5=Fri  6=Sat  7=Unknown", guidance: "Day the claim was filed. 0=Sunday through 6=Saturday, 7=Unknown." },
  { name: "total_claim", label: "Total Claim", group: "Claim", hint: "Normalized float (0–1)", guidance: "Total claim amount normalized 0–1. 1.0 = highest in dataset. Example: 0.42." },
  { name: "injury_claim", label: "Injury Claim ($)", group: "Claim", hint: "Raw dollar amount (0–10,962)", guidance: "Actual injury claim in dollars — NOT normalized. Range: 0 to 10,962. Example: 6800." },
  { name: "days open", label: "Days Open", group: "Claim", hint: "Normalized float (0–1)", guidance: "Days the claim has been open, normalized. Higher = longer open. Example: 0.49." },

  { name: "age_of_driver", label: "Driver Age", group: "Subject", hint: "Normalized float (0–1)", guidance: "Driver age normalized 0–1. Younger → lower, older → higher. Example: 0.33 ≈ mid-30s." },
  { name: "gender", label: "Gender", group: "Subject", hint: "0 = Male   1 = Female", guidance: "Driver gender. Enter 0 for Male or 1 for Female." },
  { name: "marital_status", label: "Marital Status", group: "Subject", hint: "0=Single  1=Married  2=Other", guidance: "0 = Single, 1 = Married, 2 = Divorced / Widowed / Other." },
  { name: "annual_income", label: "Annual Income", group: "Subject", hint: "Normalized float (0–1)", guidance: "Annual income normalized 0–1. Higher = higher income. Example: 0.46." },
  { name: "high_education", label: "High Education", group: "Subject", hint: "0 = No   1 = Yes", guidance: "Whether the driver holds a higher-education degree. Enter 0 or 1." },
  { name: "address_change", label: "Address Change", group: "Subject", hint: "0 = No change   1 = Changed", guidance: "Whether the policyholder recently changed address. 0 = No, 1 = Yes." },

  { name: "safety_rating", label: "Safety Rating", group: "Vehicle", hint: "Normalized float (0–1)", guidance: "Vehicle safety rating normalized 0–1. Near 1.0 = highest safety. Example: 0.625." },
  { name: "age_of_vehicle", label: "Vehicle Age (yrs)", group: "Vehicle", hint: "Raw integer years (0–15)", guidance: "Age of vehicle in years — NOT normalized. Range: 0 (new) to 15 (oldest). Example: 8." },
  { name: "vehicle_category", label: "Vehicle Category", group: "Vehicle", hint: "0=Economy  1=Mid-range  2=Luxury", guidance: "0 = Economy, 1 = Mid-range, 2 = Luxury / High-end." },
  { name: "vehicle_price", label: "Vehicle Price", group: "Vehicle", hint: "Normalized float (0–1)", guidance: "Vehicle value normalized 0–1. Higher = more expensive. Example: 0.39." },
  { name: "vehicle_color", label: "Vehicle Color", group: "Vehicle", hint: "0=White 1=Black 2=Silver 3=Red 4=Blue 5=Grey 6=Other", guidance: "Vehicle color code 0–6. 0=White, 1=Black, 2=Silver, 3=Red, 4=Blue, 5=Grey, 6=Other." },

  { name: "accident_site", label: "Accident Site", group: "Incident", hint: "0=Highway  1=Local  2=Parking", guidance: "Where the accident occurred. 0=Highway, 1=Local road, 2=Parking lot." },
  { name: "past_num_of_claims", label: "Past Claims", group: "Incident", hint: "0=None  0.333=One  0.667=Two  1=Three+", guidance: "Prior claims normalized. 0.0=none, 0.333=1 prior, 0.667=2 prior, 1.0=3 or more." },
  { name: "witness_present", label: "Witness Present", group: "Incident", hint: "0=None  1=One  2=Two or more", guidance: "Witnesses at accident scene. 0=None, 1=One, 2=Two or more." },
  { name: "liab_prct", label: "Liability %", group: "Incident", hint: "Normalized float (0=0%  1=100%)", guidance: "Insured liability normalized 0–1. 0=not at fault, 0.5=half, 1.0=fully at fault." },
  { name: "police_report", label: "Police Report", group: "Incident", hint: "0 = No report   1 = Report filed", guidance: "Whether a police report was filed. Enter 0 (No) or 1 (Yes)." },

  { name: "property_status", label: "Property Status", group: "Policy", hint: "0 = Renter   1 = Owner", guidance: "Policyholder property ownership. 0 = Renter, 1 = Homeowner." },
  { name: "zip_code", label: "ZIP Code", group: "Policy", hint: "Normalized float (0–1)", guidance: "ZIP code normalized after encoding. Enter pre-processed float. Example: 0.588." },
  { name: "channel", label: "Channel", group: "Policy", hint: "0=Online  1=Agent  2=Phone", guidance: "How the policy was purchased. 0=Online, 1=Agent, 2=Phone / call center." },
  { name: "policy deductible", label: "Deductible", group: "Policy", hint: "0=Low  0.333=Mid  1=High", guidance: "Policy deductible tier. 0.0=Lowest, 0.333=Mid-tier, 1.0=Highest." },
  { name: "annual premium", label: "Annual Premium", group: "Policy", hint: "Normalized float (0–1)", guidance: "Annual premium normalized 0–1. Higher = higher premium. Example: 0.60." },
  { name: "form defects", label: "Form Defects", group: "Policy", hint: "0  0.111  0.222  0.333 … 1.0", guidance: "Form defects normalized in steps of 0.111. 0.0=none, 1.0=most defects." },
];

const GROUPS = ["Claim", "Subject", "Vehicle", "Incident", "Policy"];

const DATASET_STATS = [
  { label: "Total Rows (Raw)", value: "12,003", color: "#60a5fa" },
  { label: "Rows After Cleaning", value: "10,977", color: "#34d399" },
  { label: "Total Columns", value: "28", color: "#a78bfa" },
  { label: "Rows Removed", value: "1,026", color: "#f87171" },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="Field guidance"
        style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.3)",
          color: "#f59e0b", fontSize: 11, fontWeight: "bold",
          cursor: "help", display: "flex", alignItems: "center",
          justifyContent: "center", lineHeight: 1, fontFamily: "monospace",
        }}
      >?</button>
      {visible && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
          transform: "translateX(-50%)", width: 240, zIndex: 200,
          background: "#0d1117", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 6, padding: "12px 14px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.8)", pointerEvents: "none",
        }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
            {text}
          </p>
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
            borderTop: "6px solid rgba(245,158,11,0.25)",
          }} />
        </div>
      )}
    </div>
  );
}

// ─── ScanLine ────────────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 5 }}>
      <div style={{
        position: "absolute", width: "100%", height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)",
        animation: "scanline 4s linear infinite",
      }} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FraudGuard() {
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>("Claim");
  const [scanProgress, setScanProgress] = useState<number>(0);

  // ── Fix hydration: generate dynamic values only on client ──
  const [caseId, setCaseId] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string>("");
  useEffect(() => {
    setCaseId(`CASE-${Date.now().toString(36).toUpperCase()}`);
    setTimestamp(new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC");
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 14;
      });
    }, 180);

    try {
      const prediction = await predictFraud(formData);
      setScanProgress(100);
      setTimeout(() => setResult(prediction), 400);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Analysis failed. Is the Flask server running on port 5000?";
      setError(message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const groupFields = FIELDS.filter((f) => f.group === activeGroup);
  const filledCount = Object.values(formData).filter((v) => v !== "").length;
  const isFraud = result?.prediction === "Fraud";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;700;900&family=Barlow:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080a0c;
          color: #c8d0d8;
          font-family: 'Barlow', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes scanline  { 0% { top:-2px } 100% { top:100% } }
        @keyframes blink     { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes reveal    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-red {
          0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.35)}
          50%{box-shadow:0 0 0 10px rgba(239,68,68,0)}
        }
        @keyframes pulse-green {
          0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.28)}
          50%{box-shadow:0 0 0 10px rgba(34,197,94,0)}
        }

        .mono { font-family:'Share Tech Mono',monospace; }
        .cond { font-family:'Barlow Condensed',sans-serif; }

        .page {
          min-height: 100vh;
          background-image:
            linear-gradient(rgba(245,158,11,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,.02) 1px, transparent 1px);
          background-size: 40px 40px;
          padding: 16px;
        }

        .wrap { max-width: 900px; margin: 0 auto; }

        /* ── Stats banner ── */
        .stats-banner {
          background: rgba(8,10,12,.97);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }
        .stats-banner::before {
          content:'';
          position:absolute; left:0; top:0; bottom:0; width:3px;
          background:linear-gradient(180deg,transparent,#f59e0b,transparent);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px 20px;
        }
        @media(min-width:540px){ .stats-grid{ grid-template-columns:repeat(4,1fr); } }

        .stat-value {
          font-family:'Share Tech Mono',monospace;
          font-size: 24px;
          font-weight: bold;
          line-height: 1;
        }
        .stat-label {
          font-family:'Barlow Condensed',sans-serif;
          font-size: 11px;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #4b5563;
          margin-top: 4px;
        }

        /* ── Retention bar ── */
        .retention { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.04); }
        .ret-bar-track { height:4px; background:rgba(255,255,255,.05); border-radius:2px; overflow:hidden; margin:6px 0 4px; }
        .ret-bar-fill  { height:100%; background:linear-gradient(90deg,#065f46,#34d399); border-radius:2px; }

        /* ── Tabs ── */
        .tabs {
          display: flex;
          gap: 4px;
          padding: 10px 14px 0;
          border-bottom: 1px solid rgba(255,255,255,.05);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar { display:none; }
        .tab {
          font-family:'Barlow Condensed',sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          padding: 8px 16px;
          border: 1px solid transparent;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          white-space: nowrap;
          background: transparent;
          color: #374151;
          transition: all .15s;
        }
        .tab:hover  { color:#6b7280; }
        .tab.active { background:rgba(245,158,11,.08); border-color:rgba(245,158,11,.22); color:#f59e0b; }

        /* ── Field ── */
        .field-wrap { width: 100%; }

        .field-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .field-label {
          font-family:'Barlow Condensed',sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #6b7280;
          transition: color .2s;
        }
        .field-label.filled { color:#f59e0b; }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.07);
          border-bottom: 2px solid rgba(245,158,11,.3);
          border-radius: 6px 6px 0 0;
          padding: 14px 14px 12px;
          color: #f0f4f8;
          font-family:'Share Tech Mono',monospace;
          font-size: 16px;
          outline: none;
          transition: all .2s;
          -webkit-appearance: none;
        }
        .field-input:focus {
          background: rgba(245,158,11,.04);
          border-bottom-color: #f59e0b;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }

        .field-hint {
          font-family:'Share Tech Mono',monospace;
          font-size: 11px;
          color: #374151;
          margin-top: 4px;
          padding: 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Submit ── */
        .submit-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(245,158,11,.45);
          border-radius: 8px;
          color: #f59e0b;
          font-family:'Barlow Condensed',sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: .2em;
          text-transform: uppercase;
          padding: 18px 0;
          cursor: pointer;
          transition: all .2s;
        }
        .submit-btn:hover:not(:disabled) { background:rgba(245,158,11,.07); border-color:#f59e0b; }
        .submit-btn:disabled { opacity:.35; cursor:not-allowed; }

        /* ── Card ── */
        .card {
          background: rgba(8,10,12,.95);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          margin-bottom: 14px;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          background: rgba(0,0,0,.25);
        }
        .card-title {
          font-family:'Barlow Condensed',sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #4b5563;
        }

        /* ── Progress bar ── */
        .progress-track { height:2px; background:rgba(0,0,0,.4); }
        .progress-fill  {
          height:100%;
          background:linear-gradient(90deg,#78350f,#f59e0b);
          transition:width .3s ease;
        }

        /* ── Result ── */
        .result-icon {
          width: 88px; height: 88px;
          margin: 0 auto 16px;
          border-radius: 6px;
          display: flex; align-items:center; justify-content:center;
        }
        .result-label {
          font-family:'Barlow Condensed',sans-serif;
          font-size: 11px; font-weight:700;
          letter-spacing:.22em; text-transform:uppercase;
          color:#4b5563; margin-bottom:6px;
        }
        .result-value {
          font-family:'Barlow Condensed',sans-serif;
          font-size: 48px; font-weight:900;
          letter-spacing:.05em; line-height:1;
        }

        /* ── Conf bar ── */
        .conf-row { display:flex; justify-content:space-between; margin-bottom:6px; }
        .conf-track { height:4px; background:rgba(255,255,255,.06); border-radius:2px; }
        .conf-fill  { height:100%; border-radius:2px; transition:width 1s ease-out; }

        /* ── API box ── */
        .api-box {
          background:rgba(0,0,0,.35);
          border:1px solid rgba(255,255,255,.04);
          border-radius:6px;
          padding:12px 14px;
          margin-top:14px;
        }
        .api-title {
          font-family:'Barlow Condensed',sans-serif;
          font-size:11px; letter-spacing:.15em;
          text-transform:uppercase; color:#374151; margin-bottom:6px;
        }

        /* ── Reference ── */
        .ref-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .ref-dot  { width:14px; height:3px; border-radius:2px; flex-shrink:0; }

        /* ── Divider ── */
        hr.div { border:none; border-top:1px solid rgba(255,255,255,.05); margin:14px 0; }

        /* ── Blink cursor ── */
        .cursor { animation:blink .85s infinite; }

        /* ── Idle spinner ring ── */
        @keyframes spin-slow { to{transform:rotate(360deg)} }
      `}</style>

      <div className="page">
        <div className="wrap">

          {/* ══ HEADER ══ */}
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 4, height: 40, background: "#f59e0b", borderRadius: 2 }} />
              <div>
                <div className="cond" style={{ fontSize: 32, fontWeight: 900, letterSpacing: ".07em", color: "#e2e8f0", lineHeight: 1 }}>
                  FRAUDGUARD <span style={{ color: "#f59e0b" }}>AI</span>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "#374151", letterSpacing: ".18em", marginTop: 3 }}>
                  INSURANCE INTELLIGENCE SYSTEM v4.2
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 12, color: "#374151" }}>{caseId}</div>
              <div className="mono" style={{ fontSize: 11, color: "#1f2937", marginTop: 2 }}>{timestamp}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
                <span className="cond" style={{ fontSize: 12, color: "#22c55e", letterSpacing: ".14em", fontWeight: 700 }}>SYSTEM ONLINE</span>
              </div>
            </div>
          </header>

          {/* ══ DATASET STATS BANNER ══ */}
          <div className="stats-banner">
            <div className="cond" style={{ fontSize: 11, letterSpacing: ".18em", color: "#374151", textTransform: "uppercase", marginBottom: 12 }}>
              Training Dataset Audit — insurance_fraud_data_cleaned.csv
            </div>
            <div className="stats-grid">
              {DATASET_STATS.map((s) => (
                <div key={s.label}>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="retention">
              <div className="cond" style={{ fontSize: 11, letterSpacing: ".14em", color: "#374151", textTransform: "uppercase" }}>
                Data Retention
              </div>
              <div className="ret-bar-track">
                <div className="ret-bar-fill" style={{ width: `${(10976 / 12002) * 100}%` }} />
              </div>
              <div className="mono" style={{ fontSize: 11, color: "#374151" }}>
                {((10976 / 12002) * 100).toFixed(1)}% of raw rows retained after cleaning
              </div>
            </div>
          </div>

          {/* ══ FORM CARD ══ */}
          <div className="card">
            <ScanLine />

            {/* Card header */}
            <div className="card-header">
              <span className="card-title">Incident Data Entry — Tap ? for field guidance</span>
              <span className="mono" style={{ fontSize: 12, color: "#374151" }}>{filledCount}/{FIELDS.length}</span>
            </div>

            {/* Fill progress */}
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(filledCount / FIELDS.length) * 100}%` }} />
            </div>

            {/* Group tabs */}
            <div className="tabs">
              {GROUPS.map((g) => (
                <button key={g} className={`tab${activeGroup === g ? " active" : ""}`} onClick={() => setActiveGroup(g)} type="button">
                  {g}
                </button>
              ))}
            </div>

            {/* Fields — single column vertical stack */}
            <form onSubmit={handleSubmit} style={{ padding: "18px 16px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 22 }}>
                {groupFields.map((field) => (
                  <div key={field.name} className="field-wrap">
                    <div className="field-label-row">
                      <label
                        className={`field-label${formData[field.name] ? " filled" : ""}`}
                        htmlFor={field.name}
                      >
                        {field.label}
                      </label>
                      <Tooltip text={field.guidance} />
                    </div>
                    <input
                      className="field-input"
                      type="number"
                      step="any"
                      id={field.name}
                      name={field.name}
                      placeholder={field.hint}
                      onChange={handleChange}
                      value={formData[field.name] ?? ""}
                      inputMode="decimal"
                    />
                    <div className="field-hint">{field.hint}</div>
                  </div>
                ))}
              </div>

              <hr className="div" />
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "◼  ANALYZING..." : "◼  EXECUTE ANALYSIS"}
              </button>
            </form>
          </div>

          {/* ══ RESULT CARD ══ */}
          <div className="card">
            <ScanLine />
            <div className="card-header">
              <span className="card-title">Risk Assessment</span>
            </div>

            <div style={{ padding: "28px 20px", minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>

              {/* IDLE */}
              {!result && !error && !loading && (
                <div style={{ textAlign: "center", animation: "reveal .4s ease" }}>
                  <div style={{
                    width: 70, height: 70, margin: "0 auto 16px",
                    border: "1px solid rgba(245,158,11,.14)", borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                      <path d="M14 4L4 10v8l10 6 10-6v-8L14 4z" stroke="rgba(245,158,11,.25)" strokeWidth="1.2" fill="none" />
                      <path d="M14 10v4" stroke="rgba(245,158,11,.4)" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="14" cy="18" r="1.2" fill="rgba(245,158,11,.4)" />
                    </svg>
                  </div>
                  <div className="cond" style={{ fontSize: 18, letterSpacing: ".18em", color: "#374151", textTransform: "uppercase" }}>
                    AWAITING DATA
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "#1f2937", marginTop: 6 }}>
                    Fill all fields and press Execute Analysis
                  </div>
                </div>
              )}

              {/* LOADING */}
              {loading && (
                <div style={{ textAlign: "center", animation: "reveal .3s ease" }}>
                  <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 18px" }}>
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="40" stroke="rgba(245,158,11,.07)" strokeWidth="2" fill="none" />
                      <circle cx="45" cy="45" r="40" stroke="#f59e0b" strokeWidth="2" fill="none"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (251 * scanProgress / 100)}
                        strokeLinecap="round"
                        style={{ transformOrigin: "center", transform: "rotate(-90deg)", transition: "stroke-dashoffset .15s" }}
                      />
                    </svg>
                    <div className="mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#f59e0b" }}>
                      {Math.floor(scanProgress)}%
                    </div>
                  </div>
                  <div className="cond" style={{ fontSize: 16, letterSpacing: ".22em", color: "#6b7280", textTransform: "uppercase", marginBottom: 12 }}>
                    SCANNING PATTERNS
                  </div>
                  {["Validating feature vector", "Applying ML classifiers", "Calculating risk score"].map((step, i) => (
                    <div key={i} className="mono" style={{
                      fontSize: 13, color: "#374151", marginTop: 6,
                      opacity: scanProgress > i * 33 ? 1 : .18, transition: "opacity .3s",
                    }}>
                      {scanProgress > i * 33 ? "✓" : "○"} {step}
                    </div>
                  ))}
                </div>
              )}

              {/* ERROR */}
              {error && (
                <div style={{ animation: "reveal .4s ease" }}>
                  <div className="mono" style={{ fontSize: 14, color: "#ef4444", marginBottom: 10, textAlign: "center" }}>⚠ ANALYSIS ERROR</div>
                  <div style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.18)", borderRadius: 6, padding: "14px 16px" }}>
                    <span className="mono" style={{ fontSize: 13, color: "#f87171", lineHeight: 1.6 }}>{error}</span>
                  </div>
                </div>
              )}

              {/* RESULT */}
              {result && (
                <div style={{ animation: "reveal .45s ease", textAlign: "center" }}>
                  <div
                    className="result-icon"
                    style={{
                      background: isFraud ? "rgba(239,68,68,.06)" : "rgba(34,197,94,.06)",
                      border: `1px solid ${isFraud ? "rgba(239,68,68,.28)" : "rgba(34,197,94,.28)"}`,
                      animation: isFraud ? "pulse-red 2s infinite" : "pulse-green 2s infinite",
                    }}
                  >
                    {isFraud ? (
                      <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                        <path d="M16 4L4 26h24L16 4z" stroke="#ef4444" strokeWidth="1.5" fill="none" />
                        <path d="M16 13v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="16" cy="22" r="1.5" fill="#ef4444" />
                      </svg>
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="12" stroke="#22c55e" strokeWidth="1.5" fill="none" />
                        <path d="M10 16l4 4 8-8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div className="result-label">CLASSIFICATION</div>
                  <div className="result-value" style={{ color: isFraud ? "#ef4444" : "#22c55e" }}>
                    {result.prediction.toUpperCase()}
                  </div>

                  {result.confidence != null && (
                    <div style={{ margin: "18px 0", textAlign: "left" }}>
                      <div className="conf-row">
                        <span className="cond" style={{ fontSize: 13, color: "#4b5563", letterSpacing: ".14em", textTransform: "uppercase" }}>Confidence</span>
                        <span className="mono" style={{ fontSize: 14, color: "#c8d0d8" }}>{(result.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="conf-track">
                        <div className="conf-fill" style={{
                          width: `${result.confidence * 100}%`,
                          background: isFraud ? "linear-gradient(90deg,#7f1d1d,#ef4444)" : "linear-gradient(90deg,#14532d,#22c55e)",
                        }} />
                      </div>
                    </div>
                  )}

                  <div className="api-box" style={{ textAlign: "left" }}>
                    <div className="api-title">API Response</div>
                    <div className="mono" style={{ fontSize: 13, color: "#4b5563", lineHeight: 2 }}>
                      <span style={{ color: "#6b7280" }}>prediction: </span>
                      <span style={{ color: isFraud ? "#f87171" : "#6ee7b7" }}>"{result.prediction}"</span><br />
                      <span style={{ color: "#6b7280" }}>confidence: </span>
                      <span style={{ color: "#d1d5db" }}>
                        {result.confidence != null ? result.confidence.toFixed(4) : "null"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ REFERENCE CARD ══ */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ padding: "16px 18px" }}>
              <div className="cond" style={{ fontSize: 13, letterSpacing: ".18em", color: "#374151", textTransform: "uppercase", marginBottom: 12 }}>
                Model Output Reference
              </div>
              <div className="ref-row">
                <div className="ref-dot" style={{ background: "#ef4444" }} />
                <span className="cond" style={{ fontSize: 15, color: "#6b7280", letterSpacing: ".1em" }}>FRAUD</span>
                <span className="mono" style={{ fontSize: 13, color: "#374151", marginLeft: "auto" }}>model returns 1</span>
              </div>
              <div className="ref-row">
                <div className="ref-dot" style={{ background: "#22c55e" }} />
                <span className="cond" style={{ fontSize: 15, color: "#6b7280", letterSpacing: ".1em" }}>NOT FRAUD</span>
                <span className="mono" style={{ fontSize: 13, color: "#374151", marginLeft: "auto" }}>model returns 0</span>
              </div>
              <hr className="div" />
              <div className="mono" style={{ fontSize: 12, color: "#1f2937", lineHeight: 1.9 }}>
                Endpoint: POST ml-project-two-olive.vercel.app<br />
                Features: 28 · Most values normalized 0–1
              </div>
            </div>
          </div>

          {/* ══ FOOTER ══ */}
          <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
            <span className="mono" style={{ fontSize: 11, color: "#1f2937" }}>FRAUDGUARD AI · CLASSIFIED INTELLIGENCE SYSTEM</span>
            <span className="mono" style={{ fontSize: 11, color: "#1f2937" }}>AUTHORIZED USE ONLY</span>
          </footer>

        </div>
      </div>
    </>
  );
}
