import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../analytics";

const backupScenes = [
  { title: "Grid supply is available", copy: "The inverter charges the battery and supplies the selected circuits.", grid: true, battery: "Charging" },
  { title: "The grid goes off", copy: "The inverter changes over to battery power for the backed-up circuits.", grid: false, battery: "Supplying" },
  { title: "Essential loads stay on", copy: "Stored energy supplies the circuits selected for backup.", grid: false, battery: "Supplying" },
  { title: "Power returns", copy: "When supply is stable, the system returns to its normal operating mode.", grid: true, battery: "Recharging" },
];

const solarScenes = [
  { title: "Sunlight is available", copy: "Solar panels produce electricity during daylight when site conditions allow.", grid: true, battery: "Charging" },
  { title: "Surplus energy is stored", copy: "The hybrid inverter manages solar, grid, battery and selected loads.", grid: true, battery: "Charging" },
  { title: "Stored power supports loads", copy: "Battery storage can supply selected circuits when solar generation falls.", grid: false, battery: "Supplying" },
  { title: "Grid support remains available", copy: "System design depends on energy needs, roof conditions and equipment selection.", grid: true, battery: "Ready" },
];

export function ConceptPlayer({ title = "How battery backup works", captionFile = "/captions/battery-backup.vtt", mode = "backup" }: { title?: string; captionFile?: string; mode?: "backup" | "solar" }) {
  const scenes = mode === "solar" ? solarScenes : backupScenes;
  const [playing, setPlaying] = useState(false);
  const [scene, setScene] = useState(0);
  const [captions, setCaptions] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [captionTrack, setCaptionTrack] = useState<string[]>(scenes.map((item) => item.copy));
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    void fetch(captionFile).then((response) => response.ok ? response.text() : "").then((text) => {
      if (!text || cancelled) return;
      const cues = text.replaceAll("\r", "").split(/\n\s*\n/).filter((block) => block.trim() && !block.trim().startsWith("WEBVTT"));
      const lines = cues.map((cue) => cue.split("\n").filter((line) => line.trim() && !line.includes("--> ") && !/^\d+$/.test(line.trim())).join(" ").trim()).filter(Boolean);
      if (lines.length && !cancelled) setCaptionTrack(lines);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [captionFile]);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync(); query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setScene((current) => {
      if (current >= scenes.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 2600);
    return () => window.clearInterval(timer);
  }, [playing]);

  function start() {
    if (scene >= scenes.length - 1) setScene(0);
    setPlaying(true);
    trackEvent("animation_play");
  }
  return (
    <div className="concept-player" aria-label={title} ref={frame}>
      <div className={`concept-stage scene-${scene}`}>
        <div className="diagram-topline"><span className="diagram-dot" /> {mode === "solar" ? "Solar + battery" : "Battery backup"} <span className="not-project">Illustration only</span></div>
        <svg className="system-diagram" viewBox="0 0 760 360" role="img" aria-labelledby="diagram-title diagram-desc">
          <title id="diagram-title">{mode === "solar" ? "Illustration of a hybrid solar system" : "Illustration of a battery backup system"}</title>
          <desc id="diagram-desc">{mode === "solar" ? "Sunlight, a hybrid inverter and a battery connect to selected building loads, with grid support available." : "Grid electricity and a battery connect through an inverter to selected loads in a building."}</desc>
          <defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 8 4.5 0 9" fill="none" stroke="currentColor" strokeWidth="1.8" /></marker></defs>
          <rect x="24" y="79" width="154" height="202" rx="4" className="diagram-building" />
          <path d="M24 116 101 62l77 54" className="diagram-roof" />
          <rect x="51" y="143" width="40" height="52" rx="2" className="diagram-window" /><rect x="111" y="143" width="40" height="52" rx="2" className="diagram-window" />
          <rect x="77" y="218" width="48" height="63" className="diagram-door" />
          <text x="101" y="314" textAnchor="middle" className="diagram-label">SELECTED CIRCUITS</text>
          <rect x="285" y="111" width="174" height="138" rx="12" className="diagram-inverter" />
          <text x="372" y="160" textAnchor="middle" className="diagram-title">HYBRID</text><text x="372" y="184" textAnchor="middle" className="diagram-label">INVERTER</text>
          <path d="M353 201h38l-22 31 4-22h-20z" className="diagram-bolt" />
          <rect x="545" y="42" width="151" height="104" rx="9" className="diagram-grid" />
          {mode === "solar" ? <g className="diagram-sun"><circle cx="620" cy="88" r="19" /><path d="M620 53v9m0 52v9m35-35h-9m-52 0h-9m60-25-7 7m-37 37-7 7m51 0-7-7m-37-37-7-7" /></g> : <path d="M581 113h80M594 87h54M608 61h27" className="diagram-grid-line" />}
          <text x="620" y="169" textAnchor="middle" className="diagram-label">{mode === "solar" ? "SUNLIGHT" : "GRID"}</text>
          <rect x="545" y="218" width="151" height="102" rx="9" className="diagram-battery" />
          <rect x="604" y="206" width="34" height="12" rx="3" className="battery-terminal" />
          <path d="M598 267h24l-14 26 3-19h-13z" className="battery-bolt" />
          <text x="650" y="283" className="diagram-label">BATTERY</text>
          <path d="M178 181h105" className="flow flow-load" markerEnd="url(#arrow)" />
          <path d="M545 93H459" className={`flow flow-grid${scenes[scene]?.grid ? " active" : ""}`} markerEnd="url(#arrow)" />
          <path d="M459 218h85" className={`flow flow-battery${!scenes[scene]?.grid ? " active" : ""}`} markerEnd="url(#arrow)" />
          <text x="231" y="164" textAnchor="middle" className="diagram-small">PROTECTED</text>
          <text x="501" y="75" textAnchor="middle" className="diagram-small">{mode === "solar" ? (scenes[scene]?.grid ? "SOLAR AVAILABLE" : "BATTERY ACTIVE") : (scenes[scene]?.grid ? "SUPPLY ON" : "SUPPLY OFF")}</text>
        </svg>
        <div className="diagram-status"><span className={`status-indicator${scenes[scene]?.grid ? " is-green" : " is-orange"}`} />{scenes[scene]?.title}<span className="status-divider">·</span>Battery {scenes[scene]?.battery.toLowerCase()}</div>
        {captions && <p className="diagram-caption" aria-live="polite">{captionTrack[scene] ?? scenes[scene]?.copy}</p>}
      </div>
      <div className="player-controls">
        <button className="player-play" onClick={() => playing ? setPlaying(false) : start()} aria-label={playing ? "Pause animation" : "Play animation"}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "Pause" : "Play"}</button>
        <button className="icon-button" onClick={() => { setScene(0); setPlaying(false); }} aria-label="Replay animation"><RotateCcw size={17} /></button>
        <div className="scene-markers" aria-label="Animation scenes">{scenes.map((item, index) => <button key={item.title} onClick={() => { setScene(index); setPlaying(false); }} aria-label={`Show scene ${index + 1}: ${item.title}`} aria-current={scene === index ? "step" : undefined}><span>{index + 1}</span></button>)}</div>
        <button className="control-label" onClick={() => setCaptions(!captions)} aria-pressed={captions}>Captions {captions ? "on" : "off"}</button>
        <button className="icon-button fullscreen-button" aria-label="View animation full screen" onClick={() => frame.current?.requestFullscreen?.()}><Maximize2 size={16} /></button>
      </div>
      {reducedMotion && <p className="motion-note">Reduced motion is on. The diagram stays still until you choose Play.</p>}
      <details className="transcript"><summary>Read the full transcript</summary><p>This is an illustrative explanation, not a project record. {captionTrack.join(" ")} Which circuits run, for how long, and the exact equipment depend on the site design.</p></details>
    </div>
  );
}
