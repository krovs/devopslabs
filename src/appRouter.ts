export type Route = { page: "index" } | { page: "labs"; scenarioId: string };

const LAB_RE = /^\/([a-z][a-z0-9-]+)$/;

export function parseRoute(path: string, validScenarioIds: Set<string>): Route | null {
  if (path === "/" || path === "") return { page: "index" };
  const match = path.match(LAB_RE);
  if (match && validScenarioIds.has(match[1] ?? "")) {
    return { page: "labs", scenarioId: match[1]! };
  }
  return null;
}

export function pushRoute(route: Route): void {
  const url = route.page === "labs" ? `/${route.scenarioId}` : "/";
  history.pushState(null, "", url);
}

export function replaceRoute(route: Route): void {
  const url = route.page === "labs" ? `/${route.scenarioId}` : "/";
  history.replaceState(null, "", url);
}

export function onPopState(callback: (url: string) => void): () => void {
  function handler(): void {
    callback(document.location.pathname + document.location.search + document.location.hash);
  }

  window.addEventListener("popstate", handler);
  return () => window.removeEventListener("popstate", handler);
}
