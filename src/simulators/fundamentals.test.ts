import { describe, expect, it } from "vitest";
import { isScenarioSolved } from "../completion";
import { runLinuxCatLog, runLinuxDf, runLinuxSystemctlRestart } from "./fundamentals";
import type { Scenario } from "../types";

describe("Linux simulator", () => {
  it("solves after reading logs, checking resources, restoring PORT, and restarting", () => {
    const scenario: Scenario = {
      id: "linuxServiceLogTriage",
      kind: "linux",
      title: "Linux Sysadmin Service Triage",
      description: "Test fixture.",
      primaryFile: "service.env",
      files: {
        "service.env": "APP_ENV=training\nLOG_LEVEL=info\nPORT=8080\n",
      },
      backend: {
        bucket: "linux",
        key: "service.env",
        table: "services",
        locked: false,
        lockId: null,
      },
      awsResources: [
        {
          type: "service",
          name: "web.service",
          id: "web",
          status: "failed",
        },
      ],
      stateResources: [
        { address: "file.service.env", id: "missing-port" },
      ],
      flags: {
        initialized: false,
        validationPassed: false,
        linuxResourcesChecked: false,
        linuxValidated: false,
      },
      solution: {
        summary: "Restore PORT.",
        steps: ["Read logs.", "Restart service."],
        commands: ["cat app.log", "df -h", "sudo systemctl restart web"],
        explanation: "The service needs PORT.",
        outcome: "The service is healthy.",
      },
    };

    runLinuxCatLog(scenario);
    runLinuxDf(scenario);
    runLinuxSystemctlRestart(scenario);

    expect(scenario.flags.linuxValidated).toBe(true);
    expect(isScenarioSolved(scenario, "linuxServiceLogTriage", "service.env")).toBe(true);
  });
});
