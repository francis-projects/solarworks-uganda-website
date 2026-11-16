import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

afterEach(cleanup);

describe("site navigation", () => {
  it("opens the mobile navigation with an accessible expanded state", () => {
    render(<SiteHeader pathname="/" />);
    const button = screen.getByRole("button", { name: /open navigation/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /request an assessment/i })).toBeVisible();
  });

  it("groups battery backup and solar under Services", () => {
    render(<SiteHeader pathname="/backup" />);
    const navigation = screen.getByRole("navigation", { name: /main navigation/i });
    const servicesMenu = navigation.querySelector("details.nav-services");
    expect(servicesMenu).not.toBeNull();
    expect(Array.from(navigation.querySelectorAll(":scope > a")).map((link) => link.textContent)).not.toContain("Backup");
    fireEvent.click(screen.getByText("Services"));
    expect(servicesMenu).toHaveAttribute("open");
    expect(screen.getByRole("link", { name: "Battery backup" })).toHaveAttribute("href", "/backup");
    expect(screen.getByRole("link", { name: "Solar + battery" })).toHaveAttribute("href", "/solar");
  });
});
