import { ArrowUpRight, CheckCircle2, LoaderCircle, MessageCircle, Phone } from "lucide-react";
import { cloneElement, useEffect, useMemo, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import { calculateAssessmentFee } from "../../shared/business";
import { site } from "../config/site";
import { TurnstileWidget } from "./TurnstileWidget";
import { trackEvent } from "../analytics";

type Props = { mode: "contact" | "assessment" };
type FormValues = {
  fullName: string; phone: string; email: string; customerType: string; location: string; interest: string;
  monthlyBill: string; outagePattern: string; outageHours: string; hasGenerator: string; generatorKva: string;
  fuelSpend: string; message: string; consent: boolean; paymentPreference: "advance" | "on_arrival";
};

const initial: FormValues = {
  fullName: "", phone: "", email: "", customerType: "", location: "", interest: "", monthlyBill: "",
  outagePattern: "", outageHours: "", hasGenerator: "", generatorKva: "", fuelSpend: "", message: "",
  consent: false, paymentPreference: "on_arrival",
};
const draftKey = "solarworks-enquiry-draft-v1";
const customerTypes = ["Home", "Shop or office", "Clinic or health facility", "School", "NGO", "Agro-processing", "Hotel or hospitality", "Other"];
const interests = ["Battery backup", "Solar + battery", "Maintenance", "Not sure"];
const waLink = `https://wa.me/${site.phoneE164.replace("+", "")}?text=${encodeURIComponent("Hello, I would like a solar or backup assessment.")}`;

function normalisePhone(value: string) { return value.replace(/[\s()-]/g, ""); }
function isUgandanPhone(value: string) { return /^(?:\+256|256|0)7\d{8}$/.test(normalisePhone(value)); }

export function EnquiryForm({ mode }: Props) {
  const isAssessment = mode === "assessment";
  const [values, setValues] = useState<FormValues>(() => {
    if (typeof window === "undefined") return initial;
    try { return { ...initial, ...JSON.parse(sessionStorage.getItem(draftKey) ?? "{}") }; } catch { return initial; }
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const fee = useMemo(() => isAssessment ? calculateAssessmentFee(values.location, false) : null, [isAssessment, values.location]);

  useEffect(() => {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ ...values, consent: false })); } catch { /* Storage may be disabled. */ }
  }, [values]);

  function update(name: keyof FormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const nextErrors: Record<string, string> = {};
    if (!values.fullName.trim() || values.fullName.trim().length < 2) nextErrors.fullName = "Enter your name.";
    if (!isUgandanPhone(values.phone)) nextErrors.phone = "Enter a Ugandan mobile number, such as 0703 786 450.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    if (!values.customerType) nextErrors.customerType = "Choose the type of site.";
    if (!values.location.trim()) nextErrors.location = "Enter a district or town.";
    if (!values.interest) nextErrors.interest = "Choose a service to discuss.";
    if (!values.consent) nextErrors.consent = "Please agree to the privacy notice before submitting.";
    if (isAssessment && !fee) nextErrors.location = "We cannot calculate an exact travel fee for this location yet. Please call or WhatsApp first.";
    if (!turnstileToken) nextErrors.verification = "Complete the security check before submitting.";
    if (Object.values(nextErrors).some(Boolean)) { setFieldErrors(nextErrors); return; }

    setSubmitting(true);
    try {
      const common = {
        full_name: values.fullName.trim(), phone: values.phone, email: values.email || null,
        customer_type: values.customerType, location: values.location.trim(), interests: [values.interest],
        monthly_bill_ugx: values.monthlyBill ? Number(values.monthlyBill) : null,
        outage_pattern: values.outagePattern || null, outage_hours: values.outageHours ? Number(values.outageHours) : null,
        has_generator: values.hasGenerator === "" ? null : values.hasGenerator === "yes",
        generator_kva: values.generatorKva ? Number(values.generatorKva) : null,
        fuel_spend_ugx: values.fuelSpend ? Number(values.fuelSpend) : null,
        message: values.message.trim() || null, consent: values.consent, turnstile_token: turnstileToken,
        source: document.referrer || "direct", referrer: document.referrer || null,
        landing_page: window.location.pathname,
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
      };
      const payload = isAssessment ? {
        ...common,
        fee_quote: fee,
        payment_preference: values.paymentPreference,
        requested_date: null,
        cancellation_terms_version: "draft-1",
      } : common;
      const response = await fetch(isAssessment ? "/api/assessments" : "/api/enquiries", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json() as { ok?: boolean; reference?: string; error?: string; field_errors?: Record<string, string> };
      if (!response.ok || !data.ok || !data.reference) {
        const fieldMap: Record<string, keyof FormValues> = { full_name: "fullName", phone: "phone", email: "email", customer_type: "customerType", location: "location", interests: "interest", consent: "consent", message: "message" };
        setFieldErrors(Object.fromEntries(Object.entries(data.field_errors ?? {}).map(([key, value]) => [fieldMap[key] ?? key, value])));
        throw new Error(data.error ?? "We could not submit your request. Please try again or contact us directly.");
      }
      setResult({ reference: data.reference });
      trackEvent("form_submit");
      setValues(initial);
      setTurnstileToken("");
      setFieldErrors({});
      sessionStorage.removeItem(draftKey);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please contact us by phone or WhatsApp.");
    } finally { setSubmitting(false); }
  }

  if (result) return <div className="success-panel" role="status"><CheckCircle2 size={38} /><span className="eyebrow">Request received</span><h2>Thank you. We have your request.</h2><p>Your reference is <strong>{result.reference}</strong>. The team will review your details and contact you using the number provided.</p>{isAssessment && <p className="small-note">Your assessment request is awaiting company review and appointment confirmation. No payment has been collected.</p>}<a className="button button-dark" href="/">Return home <ArrowUpRight size={16} /></a></div>;

  return (
    <form className="enquiry-form" onSubmit={submit} noValidate>
      <div className="form-section-title"><span>01</span><div><h2>Your details</h2><p>We only use these details to respond to your request.</p></div></div>
      <div className="form-grid">
        <Field label="Full name" required error={fieldErrors.fullName}><input autoComplete="name" value={values.fullName} onChange={(e) => update("fullName", e.target.value)} minLength={2} maxLength={80} /></Field>
        <Field label="Phone or WhatsApp" required error={fieldErrors.phone}><input autoComplete="tel" inputMode="tel" placeholder="+256 703 786 450" value={values.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
        <Field label="Email address" hint="Optional" error={fieldErrors.email}><input autoComplete="email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} /></Field>
        <Field label="Type of site" required error={fieldErrors.customerType}><select value={values.customerType} onChange={(e) => update("customerType", e.target.value)}><option value="">Choose one</option>{customerTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="District or town" required hint="Enter your area in Uganda" error={fieldErrors.location}><input autoComplete="address-level2" value={values.location} onChange={(e) => update("location", e.target.value)} maxLength={100} placeholder="e.g. Mukono" /></Field>
        <Field label="What would you like to discuss?" required error={fieldErrors.interest}><select value={values.interest} onChange={(e) => update("interest", e.target.value)}><option value="">Choose one</option>{interests.map((interest) => <option key={interest}>{interest}</option>)}</select></Field>
      </div>

      <div className="optional-details">
        <button type="button" className="optional-toggle" aria-expanded={detailsOpen} onClick={() => setDetailsOpen(!detailsOpen)}><span><strong>Help us prepare</strong><small>Optional power details for a more useful first conversation</small></span><span aria-hidden="true">{detailsOpen ? "−" : "+"}</span></button>
        {detailsOpen && <div className="form-grid optional-grid">
          <Field label="Average monthly electricity bill" hint="UGX, optional"><input inputMode="numeric" type="number" min="0" value={values.monthlyBill} onChange={(e) => update("monthlyBill", e.target.value)} /></Field>
          <Field label="How often do outages happen?" hint="Optional"><select value={values.outagePattern} onChange={(e) => update("outagePattern", e.target.value)}><option value="">Choose one</option><option value="rarely">Rarely</option><option value="few-per-week">A few times per week</option><option value="daily">Daily</option></select></Field>
          <Field label="Typical outage length" hint="Hours, optional"><input type="number" min="0" max="48" step="0.5" value={values.outageHours} onChange={(e) => update("outageHours", e.target.value)} /></Field>
          <Field label="Do you use a generator?" hint="Optional"><select value={values.hasGenerator} onChange={(e) => update("hasGenerator", e.target.value)}><option value="">Choose one</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
          {values.hasGenerator === "yes" && <><Field label="Generator size" hint="kVA, optional"><input type="number" min="0" step="0.1" value={values.generatorKva} onChange={(e) => update("generatorKva", e.target.value)} /></Field><Field label="Monthly generator fuel spend" hint="UGX, optional"><input type="number" min="0" value={values.fuelSpend} onChange={(e) => update("fuelSpend", e.target.value)} /></Field></>}
        </div>}
      </div>

      {isAssessment && <div className="fee-panel" aria-live="polite">
        <div className="fee-panel-icon"><MapPinIcon /></div>
        <div className="fee-panel-copy"><span className="eyebrow">Physical site assessment</span>{fee ? <><strong className="fee-total">UGX {fee.totalUgx.toLocaleString("en-UG")}</strong><p>Exact fee for {values.location} ({fee.distanceKm} km from {"the configured base"})</p></> : <><strong>Exact travel fee needs confirmation</strong><p>The assessment fee schedule is being configured. Call or WhatsApp us for the exact fee before requesting a physical visit.</p></>}</div>
        {!fee && <div className="fee-contact"><a href={`tel:${site.phoneE164}`} aria-label="Call SolarWorks Uganda"><Phone size={17} /></a><a href={waLink} target="_blank" rel="noreferrer" aria-label="Message SolarWorks Uganda on WhatsApp"><MessageCircle size={17} /></a></div>}
        {fee && <fieldset className="payment-choice"><legend>How would you prefer to pay?</legend><label><input type="radio" name="paymentPreference" checked={values.paymentPreference === "advance"} onChange={() => update("paymentPreference", "advance")} /> Pay in advance</label><label><input type="radio" name="paymentPreference" checked={values.paymentPreference === "on_arrival"} onChange={() => update("paymentPreference", "on_arrival")} /> Pay when the team arrives</label><small>Choosing advance payment records your preference only. No payment is collected on this website; the company will confirm instructions after reviewing the request.</small></fieldset>}
      </div>}

      <Field label="Anything else we should know?" hint="Optional, up to 1,000 characters" error={fieldErrors.message}><textarea rows={4} maxLength={1000} value={values.message} onChange={(e) => update("message", e.target.value)} placeholder="Tell us about the equipment or power challenge you have in mind." /></Field>
      <label className="consent-check"><input type="checkbox" required aria-required="true" aria-invalid={Boolean(fieldErrors.consent)} aria-describedby={fieldErrors.consent ? "consent-error" : undefined} checked={values.consent} onChange={(e) => update("consent", e.target.checked)} /><span>I agree to be contacted about this request and have read the <a href="/privacy">privacy notice</a>.</span></label>
      {fieldErrors.consent && <p className="field-error" id="consent-error">{fieldErrors.consent}</p>}
      <TurnstileWidget onToken={setTurnstileToken} />
      {fieldErrors.verification && <p className="field-error">{fieldErrors.verification}</p>}
      {error && <p className="form-error" role="alert">{error} <span>Try again or call <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>.</span></p>}
      <button className="button button-orange submit-button" type="submit" disabled={submitting || !turnstileToken || (isAssessment && !fee)}>{submitting ? <><LoaderCircle className="spin" size={17} /> Sending…</> : isAssessment ? <>Request assessment <ArrowUpRight size={16} /></> : <>Send enquiry <ArrowUpRight size={16} /></>}</button>
      <p className="form-footnote">Fields marked * are required. Your form draft stays in this browser tab until submitted or cleared.</p>
    </form>
  );
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className={`form-field${error ? " has-error" : ""}`}><label htmlFor={id}>{label}{required && <span className="required"> *</span>}{hint && <small>{hint}</small>}</label>{cloneElement(children as ReactElement<{ id?: string; required?: boolean; "aria-required"?: boolean; "aria-invalid"?: boolean; "aria-describedby"?: string }>, { id, required, "aria-required": required, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined })}{error && <small className="field-error" id={`${id}-error`}>{error}</small>}</div>;
}

function MapPinIcon() { return <span className="fee-pin" aria-hidden="true">⌖</span>; }
