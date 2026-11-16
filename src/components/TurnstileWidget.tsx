import { useEffect, useRef, useState } from "react";
import { turnstileSiteKey } from "../config/site";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; theme?: "light" | "dark"; action?: string }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!turnstileSiteKey) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !container.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: turnstileSiteKey,
        theme: "light",
        action: "public-enquiry",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
      setReady(true);
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = "true";
        script.addEventListener("load", render);
        document.head.append(script);
      } else script.addEventListener("load", render);
      const poll = window.setInterval(render, 250);
      return () => { cancelled = true; window.clearInterval(poll); script?.removeEventListener("load", render); };
    }
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = "";
    };
  }, [onToken]);

  if (!turnstileSiteKey) return <p className="verification-note">Secure form verification is not configured yet. You can still reach the team by phone or WhatsApp.</p>;
  return <div className="turnstile-wrap" aria-label="Security verification"><div ref={container} />{!ready && <span className="verification-note">Loading form verification…</span>}</div>;
}
