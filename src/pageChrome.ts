import { getPageDescription, type AppPage } from "./appUi";
import type { Scenario } from "./types";

export type PageChromeOptions = {
  page: AppPage;
  incidentMode: boolean;
  solved: boolean;
  runtime: Scenario | null;
  scenarioTitle: string;
  incidentTitle: string;
};

export function pageHeading({
  page,
  incidentMode,
  solved,
  runtime,
  scenarioTitle,
  incidentTitle,
}: PageChromeOptions): string {
  if (page === "index") return "DevOpsLabs";
  if (incidentMode && !solved) return incidentTitle;
  return runtime?.title ?? scenarioTitle;
}

export function pageSubheading({ page, incidentMode, solved, runtime }: PageChromeOptions): string {
  return runtime ? getPageDescription(page, incidentMode, solved, runtime) : "Loading scenario content…";
}
