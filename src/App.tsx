import { useEffect } from "react";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { AboutPage, AssessmentPage, BackupPage, CommercialPage, ContactPage, EstimatorPage, FAQPage, HomePage, HowItWorksPage, NotFoundPage, PrivacyPage, ProjectsPage, ServicesPage, SolarPage, TermsPage } from "./pages/SitePages";
import { analyticsToken, site } from "./config/site";
import { trackEvent } from "./analytics";

const pageInfo: Record<string, { title: string; description: string }> = {
  "/": { title: "Solar & battery backup in Uganda", description: "Practical solar and battery backup systems for homes, businesses and institutions across Uganda." },
  "/services": { title: "Solar and backup services", description: "Explore battery backup, hybrid solar, installation planning and maintenance from SolarWorks Uganda." },
  "/backup": { title: "Battery backup systems", description: "Learn how a grid-charged battery backup system can supply selected circuits during an outage." },
  "/solar": { title: "Solar + battery systems", description: "Explore hybrid solar systems with panels, an inverter, battery storage and grid support." },
  "/commercial": { title: "Commercial & industrial solar", description: "Site-led solar and backup power planning for businesses and institutions in Uganda." },
  "/how-it-works": { title: "How installation works", description: "See the steps from a first conversation and site assessment to proposal and installation." },
  "/projects": { title: "Projects and case studies", description: "SolarWorks Uganda project records will be published when project details and permissions are verified." },
  "/about": { title: "About SolarWorks Uganda", description: "Learn how SolarWorks Uganda approaches solar and battery backup planning." },
  "/faq": { title: "Solar and battery backup FAQs", description: "Answers about backup runtime, system planning, site assessments and equipment warranties." },
  "/estimator": { title: "Preliminary solar estimator", description: "Explore a preliminary energy requirement for a battery backup or hybrid solar system." },
  "/assessment": { title: "Request a site assessment", description: "Share your site requirements and receive the confirmed assessment fee before a physical visit is booked." },
  "/contact": { title: "Contact SolarWorks Uganda", description: "Contact SolarWorks Uganda by phone, WhatsApp, email or the website enquiry form." },
  "/privacy": { title: "Privacy notice", description: "Learn how SolarWorks Uganda handles enquiry and site assessment information." },
  "/terms": { title: "Website terms", description: "Draft website terms for preliminary information and physical site assessment requests." },
};

function Route({ path }: { path: string }) {
  switch (path) {
    case "/": return <HomePage />;
    case "/services": return <ServicesPage />;
    case "/backup": return <BackupPage />;
    case "/solar": return <SolarPage />;
    case "/commercial": return <CommercialPage />;
    case "/how-it-works": return <HowItWorksPage />;
    case "/projects": return <ProjectsPage />;
    case "/about": return <AboutPage />;
    case "/faq": return <FAQPage />;
    case "/estimator": return <EstimatorPage />;
    case "/assessment": return <AssessmentPage />;
    case "/contact": return <ContactPage />;
    case "/privacy": return <PrivacyPage />;
    case "/terms": return <TermsPage />;
    default: return <NotFoundPage />;
  }
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const info = pageInfo[path] ?? { title: "Page not found", description: "The requested page is not available." };
  useEffect(() => {
    document.title = `${info.title} | ${site.name}`;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) { description = document.createElement("meta"); description.name = "description"; document.head.append(description); }
    description.content = info.description;
    let ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.append(ogTitle); }
    ogTitle.content = `${info.title} | ${site.name}`;
    let ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (!ogDescription) { ogDescription = document.createElement("meta"); ogDescription.setAttribute("property", "og:description"); document.head.append(ogDescription); }
    ogDescription.content = info.description;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
    if (siteUrl) {
      if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
      canonical.href = `${siteUrl}${path === "/" ? "/" : path}`;
    } else canonical?.remove();
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.append(robots); }
    robots.content = siteUrl && pageInfo[path] ? "index,follow" : "noindex,follow";
    window.scrollTo(0, 0);
  }, [path, info.description, info.title]);

  useEffect(() => {
    if (analyticsToken && !document.querySelector("script[data-cf-analytics]")) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = "https://static.cloudflareinsights.com/beacon.min.js";
      script.dataset.cfBeacon = JSON.stringify({ token: analyticsToken });
      script.dataset.cfAnalytics = "true";
      document.head.append(script);
    }
    const started = new WeakSet<HTMLFormElement>();
    const onFocus = (event: FocusEvent) => {
      const candidate = (event.target as HTMLElement | null)?.closest("form.enquiry-form");
      if (candidate instanceof HTMLFormElement && !started.has(candidate)) { started.add(candidate); trackEvent("form_start"); }
    };
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.href.startsWith("tel:")) trackEvent("call_click");
      if (anchor.hostname === "wa.me") trackEvent("whatsapp_click");
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("focusin", onFocus); document.removeEventListener("click", onClick); };
  }, []);

  const structuredData = {
    "@context": "https://schema.org", "@type": "Organization", name: site.name, areaServed: "Uganda",
    telephone: site.phoneE164, email: site.email, url: import.meta.env.VITE_SITE_URL || undefined,
  };
  return <>
    <SiteHeader pathname={path} />
    {path !== "/" && <Breadcrumbs pathname={path} />}
    <main id="main"><Route path={path} /></main>
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
  </>;
}
