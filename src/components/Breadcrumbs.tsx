const labels: Record<string, string> = {
  services: "Services", backup: "Battery backup", solar: "Solar + battery", commercial: "Commercial & industrial",
  "how-it-works": "How it works", projects: "Projects", about: "About", faq: "FAQ", estimator: "Solar estimator",
  assessment: "Site assessment", contact: "Contact", privacy: "Privacy policy", terms: "Terms",
};

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{labels[parts.at(-1) ?? ""] ?? "Page"}</span></nav>;
}
