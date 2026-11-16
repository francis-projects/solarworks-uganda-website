export type DistanceBand = { minKm: number; maxKm: number | null; feeUgx: number };

/**
 * Owner-editable commercial inputs. Values that were not supplied are intentionally null/empty.
 * The public estimator and assessment fee workflow remain gated until the related values are set.
 */
export const businessConfig = {
  version: "2026-11-16",
  assessment: {
    baseLocationLabel: "",
    distanceBands: [] as DistanceBand[],
    locationDistanceKm: {} as Record<string, number>,
    exceptionalTravelChargeUgx: null as number | null,
    currency: "UGX",
    cancellationTermsVersion: "draft-1",
  },
  estimator: {
    batteryUsableFraction: null as number | null,
    inverterEfficiency: null as number | null,
    designPeakSunHours: null as number | null,
    pricing: {
      backupInverterPerKwUgx: null as number | null,
      hybridInverterPerKwUgx: null as number | null,
      solarPerKwUgx: null as number | null,
      batteryPerKwhUgx: null as number | null,
      installationBaseUgx: null as number | null,
      uncertaintyPercent: null as number | null,
    },
  },
  payments: {
    gateway: "unconfigured",
    onlineCollectionEnabled: false,
  },
} as const;

export function normaliseLocationKey(value: string): string {
  return value.trim().toLocaleLowerCase("en-UG").replace(/\s+/g, " ");
}

export type AssessmentFee = {
  available: true;
  distanceKm: number;
  baseFeeUgx: number;
  exceptionalChargeUgx: number;
  totalUgx: number;
};

export function calculateAssessmentFee(location: string, exceptional = false): AssessmentFee | null {
  const key = normaliseLocationKey(location);
  const distanceKm = businessConfig.assessment.locationDistanceKm[key];
  if (!key || distanceKm === undefined || businessConfig.assessment.distanceBands.length === 0) return null;

  const band = businessConfig.assessment.distanceBands.find(({ minKm, maxKm }) =>
    distanceKm >= minKm && (maxKm === null || distanceKm <= maxKm),
  );
  if (!band) return null;
  const exceptionalChargeUgx = exceptional ? businessConfig.assessment.exceptionalTravelChargeUgx : 0;
  if (exceptionalChargeUgx === null) return null;

  return {
    available: true,
    distanceKm,
    baseFeeUgx: band.feeUgx,
    exceptionalChargeUgx,
    totalUgx: band.feeUgx + exceptionalChargeUgx,
  };
}

export type EstimateInput = {
  mode: "backup" | "hybrid";
  peakLoadW: number;
  backupHours: number;
  dailyEnergyKwh: number | null;
};

export type EstimateResult = {
  deliveredEnergyKwh: number;
  loadPowerKw: number;
  nominalBatteryKwh: number | null;
  solarArrayKw: number | null;
  priceRangeUgx: { low: number; high: number } | null;
};

export function calculateEstimate(input: EstimateInput): EstimateResult {
  const deliveredEnergyKwh = input.peakLoadW * input.backupHours / 1000;
  const loadPowerKw = input.peakLoadW / 1000;
  const usable = businessConfig.estimator.batteryUsableFraction;
  const efficiency = businessConfig.estimator.inverterEfficiency;
  const nominalBatteryKwh = usable && efficiency
    ? deliveredEnergyKwh / (usable * efficiency)
    : null;
  const sunHours = businessConfig.estimator.designPeakSunHours;
  const solarArrayKw = input.mode === "hybrid" && input.dailyEnergyKwh && sunHours
    ? input.dailyEnergyKwh / sunHours
    : input.mode === "backup" ? 0 : null;

  const pricing = businessConfig.estimator.pricing;
  const uncertainty = pricing.uncertaintyPercent;
  const inverterRate = input.mode === "backup" ? pricing.backupInverterPerKwUgx : pricing.hybridInverterPerKwUgx;
  const ratesReady = inverterRate !== null
    && pricing.batteryPerKwhUgx !== null
    && pricing.installationBaseUgx !== null
    && (input.mode === "backup" || (pricing.solarPerKwUgx !== null && solarArrayKw !== null))
    && nominalBatteryKwh !== null
    && uncertainty !== null;
  if (!ratesReady) return { deliveredEnergyKwh, loadPowerKw, nominalBatteryKwh, solarArrayKw, priceRangeUgx: null };

  const base = (inverterRate as number) * loadPowerKw
    + (pricing.batteryPerKwhUgx as number) * (nominalBatteryKwh as number)
    + (pricing.installationBaseUgx as number)
    + (input.mode === "hybrid" ? (pricing.solarPerKwUgx as number) * (solarArrayKw as number) : 0);
  const margin = uncertainty as number;
  return {
    deliveredEnergyKwh,
    loadPowerKw,
    nominalBatteryKwh,
    solarArrayKw,
    priceRangeUgx: { low: Math.round(base * (1 - margin)), high: Math.round(base * (1 + margin)) },
  };
}
