import { describe, expect, it } from "vitest";
import { normalisePhone, validateEnquiry } from "./_shared";

const validRequest = {
  full_name: "Amina N.", phone: "0703 786 450", email: "amina@example.com", customer_type: "Home",
  location: "Mukono", interests: ["Battery backup"], consent: true,
};

describe("public enquiry validation", () => {
  it("normalises Ugandan mobile numbers", () => {
    expect(normalisePhone("0703 786 450")).toBe("+256703786450");
    expect(normalisePhone("+256 703 786 450")).toBe("+256703786450");
    expect(normalisePhone("077")).toBeNull();
  });

  it("accepts a valid minimal enquiry", () => {
    const result = validateEnquiry(validRequest);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.phone).toBe("+256703786450");
  });

  it("rejects missing consent and invalid phones", () => {
    const result = validateEnquiry({ ...validRequest, phone: "not a phone", consent: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors).toMatchObject({ phone: expect.any(String), consent: expect.any(String) });
  });
});
