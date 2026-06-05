import { describe, expect, it } from "vitest";
import { createLabMenuSession } from "./labMenuSession.svelte";

describe("createLabMenuSession", () => {
  it("notifies changes when a scenario is marked completed programmatically", () => {
    let changes = 0;
    const labMenu = createLabMenuSession({
      onChange: () => {
        changes += 1;
      },
    });

    labMenu.markCompleted("kubernetesEksRbacIrsa");

    expect(labMenu.completedScenarioIds).toEqual(["kubernetesEksRbacIrsa"]);
    expect(changes).toBe(1);
  });

  it("marks solved scenarios complete even when they were manually unchecked", () => {
    let changes = 0;
    const labMenu = createLabMenuSession({
      completedScenarioIds: [],
      manuallyUncheckedScenarioIds: ["kubernetesEksRbacIrsa"],
      onChange: () => {
        changes += 1;
      },
    });

    labMenu.markSolved("kubernetesEksRbacIrsa");

    expect(labMenu.completedScenarioIds).toEqual(["kubernetesEksRbacIrsa"]);
    expect(labMenu.manuallyUncheckedScenarioIds).toEqual([]);
    expect(changes).toBe(1);
  });
});
