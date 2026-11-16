import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { site } from "../config/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <>
      <section className="contact-band">
        <div className="container contact-band-inner">
          <div><span className="eyebrow eyebrow-light">Let’s plan for your site</span><h2>Start with the power<br className="desktop-only" /> you need to protect.</h2></div>
          <a className="button button-light" href="/assessment">Request a site assessment <ArrowUpRight size={16} /></a>
        </div>
      </section>
      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand-col"><Logo /><p>Practical solar and battery backup systems for homes, businesses and institutions across Uganda.</p><div className="footer-area"><MapPin size={15} /> {site.serviceArea}</div></div>
          <div className="footer-links"><h3>Explore</h3><a href="/services">Services</a><a href="/how-it-works">How it works</a><a href="/projects">Projects</a><a href="/about">About</a><a href="/faq">FAQ</a></div>
          <div className="footer-links"><h3>Get in touch</h3><a href={`tel:${site.phoneE164}`}><Phone size={15} />{site.phoneDisplay}</a><a href={`https://wa.me/${site.phoneE164.replace("+", "")}?text=${encodeURIComponent("Hello, I would like a solar or backup assessment.")}`} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} /></a><a href={`mailto:${site.email}`}><Mail size={15} />{site.email}</a><a href="/contact">Contact page</a></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} SolarWorks Uganda</span><span>Company registration, TIN and office address will be added when confirmed.</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
      </footer>
      <div className="mobile-bottom-bar" aria-label="Quick contact">
        <a href={`https://wa.me/${site.phoneE164.replace("+", "")}?text=${encodeURIComponent("Hello, I would like a solar or backup assessment.")}`} target="_blank" rel="noreferrer" className="quick-whatsapp">WhatsApp</a>
        <a href="/assessment" className="quick-assessment">Request assessment <ArrowUpRight size={15} /></a>
      </div>
    </>
  );
}
