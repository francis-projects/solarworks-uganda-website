import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstimatorPage } from "./SitePages";

describe("preliminary estimator", () => {
  it("shows the energy requirement without publishing an unconfigured price", () => {
    render(<EstimatorPage />);
    fireEvent.change(screen.getByLabelText(/combined running load/i), { target: { value: "750" } });
    fireEvent.change(screen.getByLabelText(/expected backup time/i), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /calculate energy need/i }));
    expect(screen.getByText("3.00")).toBeInTheDocument();
    expect(screen.getByText("Not available yet")).toBeInTheDocument();
  });
});
