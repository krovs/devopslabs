import { describe, expect, it } from "vitest";
import { isScenarioSolved } from "../completion";
import {
  runEksIamGetRole,
  runEksIamListRoles,
  runKubectlApplyManifest,
  runKubectlAuthCanI,
  runKubectlDescribeHpa,
  runKubectlDescribeDeployment,
  runKubectlGetEvents,
  runKubectlGetHpa,
  runKubectlGetPdb,
  runKubectlGetPods,
  runKubectlLogs,
  runKubectlDrainNode,
  runKubectlRolloutRestart,
  runKubectlRolloutStatus,
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

describe("Kubernetes interview scenario simulators", () => {
  it("solves memory OOM after events, logs, limit fix, restart, and rollout status", () => {
    const scenario: Scenario = {
      id: "kubernetesMemoryLimitOom",
      kind: "kubernetes",
      title: "Kubernetes Memory Limit OOM Triage",
      description: "Test fixture.",
      primaryFile: "deployment.yaml",
      files: {
        "deployment.yaml": "limits:\n  cpu: 500m\n  memory: 512Mi\n",
      },
      backend: { bucket: "kubernetes", key: "memory", table: "workloads", locked: false, lockId: null },
      awsResources: [{ type: "deployment", name: "checkout-api", id: "default/checkout-api", status: "failed" }],
      stateResources: [{ address: "resources.checkout-api.memoryLimit", id: "128Mi" }],
      flags: { initialized: false, validationPassed: false, kubernetesEventsChecked: false, kubernetesValidated: false },
    };

    runKubectlGetEvents(scenario, "kubernetesMemoryLimitOom");
    runKubectlDescribeDeployment(scenario, "kubernetesMemoryLimitOom");
    runKubectlLogs(scenario, "kubernetesMemoryLimitOom");
    runKubectlRolloutRestart(scenario, "kubernetesMemoryLimitOom");
    runKubectlRolloutStatus(scenario, "kubernetesMemoryLimitOom");

    expect(scenario.flags.kubernetesValidated).toBe(true);
    expect(isScenarioSolved(scenario, "kubernetesMemoryLimitOom", "deployment.yaml")).toBe(true);
  });

  it("solves HPA scaling after inspecting and applying fixed scaling policy", () => {
    const scenario: Scenario = {
      id: "kubernetesHpaScalingPolicy",
      kind: "kubernetes",
      title: "Kubernetes HPA Scaling Policy",
      description: "Test fixture.",
      primaryFile: "hpa.yaml",
      files: {
        "hpa.yaml": "minReplicas: 2\nmaxReplicas: 8\naverageUtilization: 60\n",
      },
      backend: { bucket: "kubernetes", key: "hpa", table: "workloads", locked: false, lockId: null },
      awsResources: [{ type: "horizontalpodautoscaler", name: "checkout-api", id: "default/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { initialized: false, validationPassed: false, kubernetesEventsChecked: false, kubernetesValidated: false },
    };

    runKubectlGetHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlDescribeHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlApplyManifest(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml");
    runKubectlRolloutStatus(scenario, "kubernetesHpaScalingPolicy");
    const pods = runKubectlGetPods(scenario, "kubernetesHpaScalingPolicy");

    expect(scenario.flags.kubernetesValidated).toBe(true);
    expect(isScenarioSolved(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml")).toBe(true);
    expect(pods).toHaveLength(6);
    expect(pods[pods.length - 1]).toContain("Running");
  });

  it("accepts an HPA policy with max 7 and target 80", () => {
    const scenario: Scenario = {
      id: "kubernetesHpaScalingPolicy",
      kind: "kubernetes",
      title: "Kubernetes HPA Scaling Policy",
      description: "Test fixture.",
      primaryFile: "hpa.yaml",
      files: {
        "hpa.yaml": "minReplicas: 1\nmaxReplicas: 7\naverageUtilization: 80\n",
      },
      backend: { bucket: "kubernetes", key: "hpa", table: "workloads", locked: false, lockId: null },
      awsResources: [{ type: "horizontalpodautoscaler", name: "checkout-api", id: "default/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { initialized: false, validationPassed: false, kubernetesEventsChecked: false, kubernetesValidated: false },
    };

    runKubectlGetHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlDescribeHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlApplyManifest(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml");
    const rollout = runKubectlRolloutStatus(scenario, "kubernetesHpaScalingPolicy");
    const pods = runKubectlGetPods(scenario, "kubernetesHpaScalingPolicy");

    expect(scenario.flags.kubernetesValidated).toBe(true);
    expect(isScenarioSolved(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml")).toBe(true);
    expect(rollout).toContain("hpa checkout-api stabilized at 4 replicas");
    expect(pods).toHaveLength(5);
  });

  it("keeps HPA scaling solved after an extra rollout restart", () => {
    const scenario: Scenario = {
      id: "kubernetesHpaScalingPolicy",
      kind: "kubernetes",
      title: "Kubernetes HPA Scaling Policy",
      description: "Test fixture.",
      primaryFile: "hpa.yaml",
      files: {
        "hpa.yaml": "minReplicas: 1\nmaxReplicas: 7\naverageUtilization: 60\n",
      },
      backend: { bucket: "kubernetes", key: "hpa", table: "workloads", locked: false, lockId: null },
      awsResources: [{ type: "horizontalpodautoscaler", name: "checkout-api", id: "default/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { initialized: false, validationPassed: false, kubernetesEventsChecked: false, kubernetesValidated: false },
    };

    runKubectlGetHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlDescribeHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlApplyManifest(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml");
    runKubectlRolloutRestart(scenario, "kubernetesHpaScalingPolicy");
    runKubectlRolloutStatus(scenario, "kubernetesHpaScalingPolicy");

    expect(scenario.flags.kubernetesValidated).toBe(true);
    expect(isScenarioSolved(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml")).toBe(true);
  });

  it("explains why an HPA policy with target 90 is not accepted", () => {
    const scenario: Scenario = {
      id: "kubernetesHpaScalingPolicy",
      kind: "kubernetes",
      title: "Kubernetes HPA Scaling Policy",
      description: "Test fixture.",
      primaryFile: "hpa.yaml",
      files: {
        "hpa.yaml": "minReplicas: 2\nmaxReplicas: 7\naverageUtilization: 90\n",
      },
      backend: { bucket: "kubernetes", key: "hpa", table: "workloads", locked: false, lockId: null },
      awsResources: [{ type: "horizontalpodautoscaler", name: "checkout-api", id: "default/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { initialized: false, validationPassed: false, kubernetesEventsChecked: false, kubernetesValidated: false },
    };

    runKubectlGetHpa(scenario, "kubernetesHpaScalingPolicy");
    runKubectlDescribeHpa(scenario, "kubernetesHpaScalingPolicy");
    const output = runKubectlApplyManifest(scenario, "kubernetesHpaScalingPolicy", "hpa.yaml");

    expect(output[output.length - 1]).toContain("averageUtilization should be 80 or lower");
    expect(scenario.flags.cleanPlan).not.toBe(true);
  });

  it("solves PDB node drain after inspecting PDB and applying maxUnavailable 1", () => {
    const scenario: Scenario = {
      id: "kubernetesPdbNodeDrain",
      kind: "kubernetes",
      title: "Kubernetes PodDisruptionBudget Node Drain",
      description: "Test fixture.",
      primaryFile: "pdb.yaml",
      files: {
        "pdb.yaml": "maxUnavailable: 1\n",
      },
      backend: { bucket: "kubernetes", key: "pdb", table: "workloads", locked: false, lockId: null },
      awsResources: [{ type: "poddisruptionbudget", name: "checkout-api", id: "default/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { initialized: false, validationPassed: false, kubernetesEventsChecked: false, kubernetesValidated: false },
    };

    runKubectlGetPdb(scenario, "kubernetesPdbNodeDrain");
    runKubectlApplyManifest(scenario, "kubernetesPdbNodeDrain", "pdb.yaml");
    runKubectlDrainNode(scenario, "kubernetesPdbNodeDrain");

    expect(scenario.flags.kubernetesValidated).toBe(true);
    expect(isScenarioSolved(scenario, "kubernetesPdbNodeDrain", "pdb.yaml")).toBe(true);
  });
});
