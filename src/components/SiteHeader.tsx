import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { site } from "../config/site";
import { Logo } from "./Logo";

const links = [
  ["Services", "/services"],
  ["Backup", "/backup"],
  ["Solar", "/solar"],
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
      <div className="topline"><span>Power that fits the way you work.</span><span>{site.serviceArea}</span></div>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className={`main-nav${open ? " is-open" : ""}`} aria-label="Main navigation">
            {links.map(([label, href]) => (
              <a key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <a className="mobile-menu-cta" href="/assessment" onClick={() => setOpen(false)}>Request an assessment <ArrowUpRight size={16} /></a>
          </nav>
          <a className="button button-dark header-cta" href="/assessment">Request assessment <ArrowUpRight size={16} /></a>
          <button className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
    </>
  );
}
