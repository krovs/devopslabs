import type { Scenario } from "../types";

export type OperationalValidationFlag =
  | "secretsValidated"
  | "dnsValidated"
  | "observabilityValidated"
  | "finopsValidated"
  | "policyValidated"
  | "gitopsValidated"
  | "incidentValidated"
  | "drValidated"
  | "databaseValidated"
  | "supplyChainValidated"
  | "sreValidated"
  | "messagingValidated";

export function markOperationalScenarioSolved(runtime: Scenario, flag: OperationalValidationFlag, note: string): void {
  runtime.flags[flag] = true;
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = note;
  }
}

export function markFirstResourceFailed(runtime: Scenario, note: string): void {
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = note;
  }
}
