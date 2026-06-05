import { describe, expect, it } from "vitest";
import { isScenarioSolved } from "../completion";
import {
  runEksIamGetRole,
  runEksIamListRoles,
  runKubectlAuthCanI,
  runKubectlDescribeDeployment,
  runKubectlGetEvents,
  runKubectlLogs,
  runLinuxCatLog,
  runLinuxDf,
  runLinuxSystemctlRestart,
} from "./fundamentals";
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

describe("Kubernetes EKS IRSA simulator", () => {
  it("exposes the workload service account and matching IAM role trust policy", () => {
    const scenario: Scenario = {
      id: "kubernetesEksRbacIrsa",
      kind: "kubernetes",
      title: "Kubernetes EKS RBAC And IRSA Triage",
      description: "Test fixture.",
      primaryFile: "serviceaccount.yaml",
      files: {
        "serviceaccount.yaml": "apiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: checkout-api\n  namespace: payments\n  annotations:\n    eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/eks-default-readonly\n",
        "rbac.yaml": "subjects:\n  - kind: ServiceAccount\n    name: checkout-worker\n    namespace: payments\n",
      },
      backend: {
        bucket: "kubernetes",
        key: "checkout-api-eks-rbac-irsa",
        table: "workloads",
        locked: false,
        lockId: null,
      },
      awsResources: [],
      stateResources: [],
      flags: {
        initialized: false,
        validationPassed: false,
      },
      solution: {
        summary: "Fix IRSA.",
        steps: ["Inspect IAM trust policy."],
        commands: ["aws iam get-role --role-name eks-checkout-api-payments"],
        explanation: "The ServiceAccount subject must match the role trust policy.",
        outcome: "The workload can assume the role.",
      },
    };

    expect(runKubectlDescribeDeployment(scenario, "kubernetesEksRbacIrsa")).toContain("  Service Account: checkout-api");
    expect(runEksIamListRoles(scenario, "kubernetesEksRbacIrsa")).toContain("  Tags: namespace=payments, app=checkout-api, access=orders-sqs");

    const role = runEksIamGetRole(scenario, "kubernetesEksRbacIrsa", "eks-checkout-api-payments");

    expect(role).toContain("  Arn: arn:aws:iam::111122223333:role/eks-checkout-api-payments");
    expect(role).toContain("      oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub: system:serviceaccount:payments:checkout-api");

    expect(runKubectlAuthCanI(scenario, "kubernetesEksRbacIrsa")).toContain("no");

    scenario.files["rbac.yaml"] = "subjects:\n  - kind: ServiceAccount\n    name: checkout-api\n    namespace: payments\n";

    expect(runKubectlAuthCanI(scenario, "kubernetesEksRbacIrsa")).toContain("yes");
    expect(runKubectlGetEvents(scenario, "kubernetesEksRbacIrsa").join("\n")).not.toContain("RBAC denied configmaps");
    expect(runKubectlGetEvents(scenario, "kubernetesEksRbacIrsa").join("\n")).toContain("AWS role eks-default-readonly cannot access orders queue");
    expect(runKubectlLogs(scenario, "kubernetesEksRbacIrsa")).toEqual([
      "loaded checkout-config from namespace payments",
      "ERROR aws sdk: AccessDenied for sqs:SendMessage using role arn:aws:iam::111122223333:role/eks-default-readonly",
    ]);
  });
});
