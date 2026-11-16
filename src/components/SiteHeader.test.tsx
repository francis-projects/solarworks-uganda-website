import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

describe("site navigation", () => {
  it("opens the mobile navigation with an accessible expanded state", () => {
    render(<SiteHeader pathname="/" />);
    const button = screen.getByRole("button", { name: /open navigation/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /request an assessment/i })).toBeVisible();
  });
});
