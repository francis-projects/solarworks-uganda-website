import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

const links = [
  ["How it works", "/how-it-works"],
  ["Projects", "/projects"],
  ["About", "/about"],
  ["FAQ", "/faq"],
] as const;

export function SiteHeader({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className={`main-nav${open ? " is-open" : ""}`} aria-label="Main navigation">
            <details className={`nav-services${["/services", "/backup", "/solar", "/commercial"].includes(pathname) ? " is-current" : ""}`}>
              <summary aria-current={["/services", "/backup", "/solar", "/commercial"].includes(pathname) ? "page" : undefined}>
                Services <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div className="services-menu" aria-label="Services">
                {[["Overview", "/services"], ["Battery backup", "/backup"], ["Solar + battery", "/solar"], ["Commercial & industrial", "/commercial"]].map(([label, href]) => (
                  <a key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>
                ))}
              </div>
            </details>
            {links.map(([label, href]) => (
              <a key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <a className="mobile-menu-cta" href="/assessment" onClick={() => setOpen(false)}>Request an assessment <ArrowUpRight size={16} /></a>
          </nav>
          <a className="button button-orange header-cta" href="/assessment">Request assessment <ArrowUpRight size={16} /></a>
          <button className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
    </>
  );
}
