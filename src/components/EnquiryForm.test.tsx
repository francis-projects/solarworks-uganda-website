import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnquiryForm } from "./EnquiryForm";

describe("assessment and contact forms", () => {
  it("shows field-specific validation before any request is sent", () => {
    const { container } = render(<EnquiryForm mode="contact" />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText(/enter a ugandan mobile number/i)).toBeInTheDocument();
    expect(screen.getByText(/please agree to the privacy notice/i)).toBeInTheDocument();
  });

  it("does not allow an assessment request without a configured exact fee", () => {
    render(<EnquiryForm mode="assessment" />);
    expect(screen.getByText(/exact travel fee needs confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request assessment/i })).toBeDisabled();
  });
});
