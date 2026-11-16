import { ArrowDownRight, Sun } from "lucide-react";

export function PowerIllustration() {
  return (
    <div className="power-illustration" role="img" aria-label="Illustrative solar and battery system, not a company installation">
      <div className="illustration-label"><span className="live-dot" /> SYSTEM OVERVIEW <span>ILLUSTRATIVE</span></div>
      <svg viewBox="0 0 680 470" className="power-svg" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" x2="1"><stop stopColor="#e9f3e8" /><stop offset="1" stopColor="#d8ead8" /></linearGradient>
          <linearGradient id="solar" x1="0" x2="1"><stop stopColor="#799a7c" /><stop offset="1" stopColor="#527755" /></linearGradient>
          <linearGradient id="wall" x1="0" x2="1"><stop stopColor="#f7f8f2" /><stop offset="1" stopColor="#dce6d9" /></linearGradient>
          <pattern id="panel-grid" width="27" height="20" patternUnits="userSpaceOnUse"><path d="M27 0H0v20" fill="none" stroke="#d4e2d1" strokeWidth="1.2" opacity=".8" /></pattern>
        </defs>
        <rect x="24" y="18" width="632" height="412" rx="16" fill="url(#sky)" />
        <circle cx="539" cy="100" r="54" fill="#e2ac12" opacity=".1" /><circle cx="539" cy="100" r="35" fill="#e2ac12" opacity=".18" /><circle cx="539" cy="100" r="19" fill="#e9b21b" />
        <path d="M88 309 287 148l205 160" fill="none" stroke="#8da38f" strokeWidth="13" strokeLinejoin="round" />
        <path d="M128 300 289 173l167 130v86H128z" fill="url(#wall)" />
        <path d="M125 295 288 162l173 136-5 20-167-129-156 127z" fill="#58775d" />
        <path d="m160 273 129-103 137 108-4 6-133-102-125 100z" fill="url(#solar)" />
        <path d="m160 273 129-103 137 108" fill="url(#panel-grid)" stroke="#e0eadc" strokeWidth="1.5" />
        <path d="M160 273 289 170l137 108M202 240l120-77M240 267l120-78M279 295l120-78M190 249l14 15M236 213l15 17M282 184l17 19M329 191l-6 22M370 225l-8 22" stroke="#c5d8c2" strokeWidth="1" opacity=".9" />
        <rect x="175" y="260" width="31" height="51" rx="3" fill="#d7dbd4" /><rect x="219" y="250" width="31" height="61" rx="3" fill="#d7dbd4" />
        <rect x="307" y="290" width="33" height="50" rx="3" fill="#b4bbb2" /><rect x="392" y="275" width="40" height="38" rx="3" fill="#b2c2b9" />
        <rect x="411" y="342" width="81" height="96" rx="8" fill="#d8a914" />
        <rect x="422" y="353" width="59" height="76" rx="4" fill="#315b3d" />
        <rect x="438" y="362" width="27" height="4" rx="2" fill="#e0e9dc" opacity=".8" /><circle cx="451" cy="390" r="10" fill="#84a98a" /><path d="M447 390h8M451 386v8" stroke="#f4f7ef" strokeWidth="1.5" />
        <path d="M435 414h32" stroke="#d5dfd7" strokeWidth="2" />
        <rect x="529" y="320" width="76" height="96" rx="7" fill="#557c5b" />
        <rect x="552" y="311" width="30" height="10" rx="3" fill="#bbc7be" />
        <rect x="542" y="337" width="50" height="7" rx="3.5" fill="#97bd9a" />
        <path d="M492 386h37M411 387h-40V310h-31" fill="none" stroke="#9b8a46" strokeWidth="2.4" strokeDasharray="6 5" />
        <path d="M390 234h67" fill="none" stroke="#71997a" strokeWidth="2.2" strokeDasharray="6 5" />
        <rect x="365" y="214" width="77" height="42" rx="6" fill="#44734d" stroke="#83a687" />
        <path d="m395 228 10 0-7 14 2-9h-8z" fill="#edbf2b" />
        <path d="M76 382h160" stroke="#819881" strokeWidth="3" />
        <path d="M214 382h126" stroke="#819881" strokeWidth="3" />
        <text x="128" y="353" fill="#50615b" fontFamily="Manrope, sans-serif" fontSize="10" letterSpacing="2">HOME + BUSINESS</text>
      </svg>
      <div className="diagram-callout callout-solar"><Sun size={14} /><span>Solar array</span><small>Illustrative layout</small></div>
      <div className="diagram-callout callout-battery"><span className="battery-dot" /><span>Battery backup</span><small>Selected loads</small></div>
      <div className="diagram-callout callout-inverter"><span className="inverter-dot" /><span>Hybrid inverter</span></div>
      <div className="illustration-footer"><span>Concept illustration · Equipment selection follows site assessment</span><ArrowDownRight size={15} /></div>
      <div className="illustration-index">01 / 03</div>
    </div>
  );
}
