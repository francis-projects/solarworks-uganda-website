import axe from "axe-core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(cleanup);

describe("page accessibility", () => {
  it("has no serious or critical WCAG 2.1 A/AA violations on key journeys", async () => {
    for (const path of ["/", "/assessment", "/contact"]) {
      window.history.replaceState({}, "", path);
      const { container } = render(<App />);
      const result = await axe.run(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
      const significant = result.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
      expect(significant, `${path}: ${significant.map((violation) => violation.id).join(", ")}`).toEqual([]);
      cleanup();
    }
  });
});
