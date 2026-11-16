import { describe, expect, it } from "vitest";
import { calculateAssessmentFee, calculateEstimate } from "./business";

describe("preliminary sizing", () => {
  it("calculates delivered energy from load and backup hours", () => {
    const result = calculateEstimate({ mode: "backup", peakLoadW: 750, backupHours: 4, dailyEnergyKwh: null });
    expect(result.loadPowerKw).toBe(0.75);
    expect(result.deliveredEnergyKwh).toBe(3);
  });

  it("withholds battery capacity and pricing while assumptions remain unconfigured", () => {
    const result = calculateEstimate({ mode: "hybrid", peakLoadW: 1800, backupHours: 3, dailyEnergyKwh: 8 });
    expect(result.nominalBatteryKwh).toBeNull();
    expect(result.solarArrayKw).toBeNull();
    expect(result.priceRangeUgx).toBeNull();
  });
});

describe("assessment fee disclosure", () => {
  it("does not invent a fee for unmapped locations", () => {
    expect(calculateAssessmentFee("Mukono")).toBeNull();
  });
});
