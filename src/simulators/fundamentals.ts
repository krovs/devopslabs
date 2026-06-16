import type { Scenario } from "../types";

function setFirstResource(runtime: Scenario, status: string, note: string): void {
  if (!runtime.awsResources[0]) return;
  runtime.awsResources[0].status = status;
  runtime.awsResources[0].note = note;
}

export function runLinuxLs(runtime: Scenario): string[] {
  runtime.flags.initialized = true;
  return ["total 20", "drwxr-xr-x 2 app app 4096 .", "-rw-r--r-- 1 app app  184 app.log", "-rw-r--r-- 1 app app   42 service.env"];
}

export function runLinuxCatLog(runtime: Scenario): string[] {
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  return [
    "2026-06-01T09:14:22Z INFO starting web service",
    "2026-06-01T09:14:23Z ERROR missing PORT in service.env",
    "2026-06-01T09:14:23Z INFO service exited",
  ];
}

export function runLinuxGrepError(runtime: Scenario): string[] {
  runtime.flags.validationPassed = true;
  return ["app.log:2026-06-01T09:14:23Z ERROR missing PORT in service.env"];
}

export function runLinuxDf(runtime: Scenario): string[] {
  runtime.flags.linuxResourcesChecked = true;
  return ["Filesystem      Size  Used Avail Use% Mounted on", "/dev/root        40G   18G   20G  48% /", "/dev/nvme1n1     20G   12G  7.1G  63% /var"];
}

export function runLinuxFree(runtime: Scenario): string[] {
  runtime.flags.linuxResourcesChecked = true;
  return ["               total        used        free      shared  buff/cache   available", "Mem:            7974        2821        1630         118        3523        4731", "Swap:           2048           0        2048"];
}

export function runLinuxPs(runtime: Scenario): string[] {
  runtime.flags.linuxResourcesChecked = true;
  return ["USER       PID %CPU %MEM COMMAND", "root         1  0.1  0.3 systemd", "app       4217  0.0  1.2 node /srv/web/server.js", "root      4250  0.0  0.1 sshd: runner"];
}

export function runLinuxTop(runtime: Scenario): string[] {
  runtime.flags.linuxResourcesChecked = true;
  return ["top - 09:15:02 up 8 days,  1 user,  load average: 0.14, 0.19, 0.21", "%Cpu(s):  3.1 us,  1.0 sy, 95.0 id", "MiB Mem : 7974 total, 1630 free, 2821 used, 3523 buff/cache"];
}

export function runLinuxJournalctl(runtime: Scenario): string[] {
  runtime.flags.validationPassed = true;
  return ["Jun 01 09:14:23 web[4217]: ERROR missing PORT in service.env", "Jun 01 09:14:23 systemd[1]: web.service: Main process exited, code=exited, status=1/FAILURE"];
}

export function runLinuxSs(runtime: Scenario): string[] {
  runtime.flags.linuxResourcesChecked = true;
  return ["Netid State  Local Address:Port  Process", "tcp   LISTEN 0.0.0.0:22          users:((\"sshd\",pid=4250))", "tcp   CLOSED 0.0.0.0:8080        users:((\"web\",pid=4217))"];
}

export function runLinuxSystemctlStatus(runtime: Scenario): string[] {
  if (runtime.flags.linuxValidated) return ["web.service - demo web service", "Active: active (running)", "Main PID: 4242"];
  return ["web.service - demo web service", "Active: failed", "Result: exit-code"];
}

export function runLinuxSystemctlRestart(runtime: Scenario): string[] {
  const env = runtime.files["service.env"] ?? "";
  if (env.includes("PORT=8080") && runtime.flags.validationPassed && runtime.flags.linuxResourcesChecked) {
    runtime.flags.linuxValidated = true;
    setFirstResource(runtime, "success", "Service starts after logs and system resources were checked and PORT was restored.");
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "file.service.env" ? { ...resource, id: "PORT=8080" } : resource,
    );
    return ["Restarting web.service...", "web.service is active (running)."];
  }

  setFirstResource(runtime, "failed", "Service restart still fails because PORT is missing or basic system checks were skipped.");
  return ["Restarting web.service...", "web.service failed. Check logs plus memory, disk, processes, and service environment."];
}

function isReadinessProbeScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesReadinessProbePort";
}

function isHelmValuesScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesHelmValuesPort";
}

function isEksRbacIrsaScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesEksRbacIrsa";
}

function isMemoryLimitScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesMemoryLimitOom";
}

function isHpaScalingScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesHpaScalingPolicy";
}

function isPdbNodeDrainScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesPdbNodeDrain";
}

function readinessProbeUsesAppPort(deployment: string): boolean {
  return /readinessProbe:[\s\S]*httpGet:[\s\S]*port: 8080/.test(deployment);
}

function helmValuesUseAppPort(values: string): boolean {
  return /containerPort:\s*8080/.test(values);
}

function eksRbacBindsCheckoutApi(rbac: string): boolean {
  return /kind:\s*ServiceAccount[\s\S]*name:\s*checkout-api[\s\S]*namespace:\s*payments/.test(rbac);
}

function eksServiceAccountUsesPaymentsRole(serviceAccount: string): boolean {
  return serviceAccount.includes("eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/eks-checkout-api-payments");
}

function memoryLimitIsRaised(deployment: string): boolean {
  return /limits:[\s\S]*cpu:\s*500m[\s\S]*memory:\s*512Mi/.test(deployment) && !deployment.includes("memory: 128Mi");
}

function hpaScalingPolicyIsFixed(hpa: string): boolean {
  const policy = parseHpaScalingPolicy(hpa);
  return Boolean(policy && policy.minReplicas >= 1 && policy.minReplicas <= 2 && policy.maxReplicas >= 7 && policy.averageUtilization <= 80);
}

function parseHpaScalingPolicy(hpa: string): { minReplicas: number; maxReplicas: number; averageUtilization: number } | null {
  const minReplicas = Number(hpa.match(/minReplicas:\s*(\d+)/)?.[1]);
  const maxReplicas = Number(hpa.match(/maxReplicas:\s*(\d+)/)?.[1]);
  const averageUtilization = Number(hpa.match(/averageUtilization:\s*(\d+)/)?.[1]);
  if (!Number.isFinite(minReplicas) || !Number.isFinite(maxReplicas) || !Number.isFinite(averageUtilization)) return null;
  return { minReplicas, maxReplicas, averageUtilization };
}

function hpaStableReplicaCount(hpa: string): number {
  const policy = parseHpaScalingPolicy(hpa);
  if (!policy) return 3;
  return policy.averageUtilization <= 60 ? 5 : 4;
}

function hpaCurrentCpuDisplay(hpa: string): string {
  const policy = parseHpaScalingPolicy(hpa);
  if (!policy) return "92%/90%";
  if (!hpaScalingPolicyIsFixed(hpa)) return `92%/${policy.averageUtilization}%`;
  return `${Math.max(policy.averageUtilization - 2, 1)}%/${policy.averageUtilization}%`;
}

function hpaScalingPolicySummary(hpa: string): string {
  const policy = parseHpaScalingPolicy(hpa);
  if (!policy) return "HPA applied; verify rollout.";
  return `HPA applied with min ${policy.minReplicas}, max ${policy.maxReplicas}, and ${policy.averageUtilization} percent CPU target; verify rollout.`;
}

function hpaScalingPolicySuccessMessage(hpa: string): string {
  const policy = parseHpaScalingPolicy(hpa);
  if (!policy) return "HPA can scale checkout-api before saturation.";
  return (
    `HPA can scale checkout-api from ${policy.minReplicas} to ${policy.maxReplicas} replicas ` +
    `at ${policy.averageUtilization} percent CPU, before pods are saturated.`
  );
}

function hpaScalingPolicyFeedback(hpa: string): string {
  const policy = parseHpaScalingPolicy(hpa);
  if (!policy) return "warning: HPA manifest must include minReplicas, maxReplicas, and averageUtilization";

  const issues = [];
  if (policy.minReplicas < 1 || policy.minReplicas > 2) issues.push("minReplicas should stay at 1 or 2 for this incident");
  if (policy.maxReplicas < 7) issues.push("maxReplicas should be at least 7 so the HPA is not capped during the spike");
  if (policy.averageUtilization > 80) issues.push("averageUtilization should be 80 or lower so scaling starts before pods are saturated");
  return issues.length ? `warning: ${issues.join("; ")}` : "warning: inspect the HPA state before applying the manifest";
}

function pdbAllowsOneDisruption(pdb: string): boolean {
  return /maxUnavailable:\s*1/.test(pdb) && !/maxUnavailable:\s*3/.test(pdb);
}

export function runKubectlGetPods(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;
  if (isEksRbacIrsaScenario(scenarioId)) return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-5d9f6bbd76-zm9kq   1/1     Running   3"];
  if (isPdbNodeDrainScenario(scenarioId)) return ["NAME                            READY   STATUS    RESTARTS   NODE", "checkout-api-7bd8dfc6d4-2q8xp   1/1     Running   0          ip-10-0-4-21", "checkout-api-7bd8dfc6d4-5jv7m   1/1     Running   0          ip-10-0-5-12", "checkout-api-7bd8dfc6d4-rp9kx   1/1     Running   0          ip-10-0-6-33"];
  if (isHpaScalingScenario(scenarioId)) {
    const hpa = runtime.files["hpa.yaml"] ?? "";
    if (runtime.flags.cleanPlan && hpaScalingPolicyIsFixed(hpa)) {
      const pods = [
        "NAME                            READY   STATUS    RESTARTS",
        "checkout-api-7bd8dfc6d4-2q8xp   1/1     Running   0",
        "checkout-api-7bd8dfc6d4-5jv7m   1/1     Running   0",
        "checkout-api-7bd8dfc6d4-rp9kx   1/1     Running   0",
        "checkout-api-7bd8dfc6d4-vh6mn   1/1     Running   0",
        "checkout-api-7bd8dfc6d4-x9t4b   1/1     Running   0",
      ];
      return pods.slice(0, hpaStableReplicaCount(hpa) + 1);
    }
    return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-7bd8dfc6d4-2q8xp   1/1     Running   0", "checkout-api-7bd8dfc6d4-5jv7m   1/1     Running   0", "checkout-api-7bd8dfc6d4-rp9kx   1/1     Running   0"];
  }
  if (runtime.flags.kubernetesValidated) return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-6d7c9b7c9b-2q8xp   1/1     Running   0"];
  if (isMemoryLimitScenario(scenarioId)) return ["NAME                            READY   STATUS             RESTARTS", "checkout-api-74d6d5b969-nq2zp   0/1     CrashLoopBackOff   7"];
  if (isHelmValuesScenario(scenarioId)) return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-7f5f6c9f7b-r2lsk   0/1     Running   0"];
  if (isReadinessProbeScenario(scenarioId)) return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-6d7c9b7c9b-2q8xp   0/1     Running   0"];
  return ["NAME                            READY   STATUS             RESTARTS", "checkout-api-6d7c9b7c9b-2q8xp   0/1     ImagePullBackOff   4"];
}

export function runKubectlDescribeDeployment(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.validationPassed = true;
  if (isEksRbacIrsaScenario(scenarioId)) {
    return [
      "Name: checkout-api",
      "Namespace: payments",
      "Selector: app=checkout-api",
      "Pod Template:",
      "  Service Account: checkout-api",
      "  Containers:",
      "   checkout-api:",
      "    Image: ghcr.io/acme/checkout-api:1.4.2",
      "Condition: Progressing=True Reason=NewReplicaSetAvailable",
    ];
  }

  return runKubectlDescribePod(runtime, scenarioId);
}

export function runKubectlDescribePod(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.validationPassed = true;
  if (isEksRbacIrsaScenario(scenarioId)) {
    const rbac = runtime.files["rbac.yaml"] ?? "";
    const serviceAccount = runtime.files["serviceaccount.yaml"] ?? "";
    const output = [
      "Name: checkout-api-5d9f6bbd76-zm9kq",
      "Namespace: payments",
      "Service Account: checkout-api",
      "Status: Running",
    ];
    if (!eksRbacBindsCheckoutApi(rbac)) output.push("Warning  FailedAuthorization  serviceaccount payments/checkout-api cannot get resource configmaps");
    if (!eksServiceAccountUsesPaymentsRole(serviceAccount)) output.push("Warning  AccessDenied          IRSA role eks-default-readonly cannot send messages to orders queue");
    if (output.length === 4) output.push("Authorization checks are clear; restart rollout to refresh pods.");
    return output;
  }

  if (isHelmValuesScenario(scenarioId)) {
    return [
      "Name: checkout-api-7f5f6c9f7b-r2lsk",
      "Image: ghcr.io/acme/checkout-api:1.4.2",
      "ContainersReady: False",
      "Container port: 9090",
      "Readiness probe: http-get http://:9090/healthz",
      "Warning  Unhealthy  Readiness probe failed: app listens on :8080",
    ];
  }

  if (isMemoryLimitScenario(scenarioId)) {
    return [
      "Name: checkout-api-74d6d5b969-nq2zp",
      "Image: ghcr.io/acme/checkout-api:1.4.2",
      "State: Waiting",
      "Reason: CrashLoopBackOff",
      "Last State: Terminated",
      "Reason: OOMKilled",
      "Exit Code: 137",
      "Limits: memory=128Mi cpu=500m",
      "Requests: memory=256Mi cpu=100m",
    ];
  }

  if (isHpaScalingScenario(scenarioId)) {
    return [
      "Name: checkout-api-7bd8dfc6d4-2q8xp",
      "Image: ghcr.io/acme/checkout-api:1.4.2",
      "Status: Running",
      "CPU: 92%",
      "Finding: HPA maxReplicas is 3, all replicas are saturated.",
    ];
  }

  if (isPdbNodeDrainScenario(scenarioId)) {
    return [
      "Name: checkout-api-7bd8dfc6d4-2q8xp",
      "Status: Running",
      "Controlled By: ReplicaSet/checkout-api-7bd8dfc6d4",
      "Node: ip-10-0-4-21",
      "Finding: planned drain depends on PodDisruptionBudget checkout-api.",
    ];
  }

  if (isReadinessProbeScenario(scenarioId)) {
    return [
      "Name: checkout-api-6d7c9b7c9b-2q8xp",
      "Image: ghcr.io/acme/checkout-api:1.4.2",
      "ContainersReady: False",
      "Readiness probe: http-get http://:9090/healthz",
      "Warning  Unhealthy  Readiness probe failed: dial tcp 10.42.1.17:9090: connect: connection refused",
    ];
  }

  return [
    "Name: checkout-api-6d7c9b7c9b-2q8xp",
    "Image: ghcr.io/acme/checkout-api:latest",
    "Warning  Failed  Failed to pull image: tag latest is not allowed in this cluster",
    "ImagePolicy: approved immutable tag is ghcr.io/acme/checkout-api:1.4.2",
  ];
}

export function runKubectlGetEvents(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.kubernetesEventsChecked = true;
  if (isEksRbacIrsaScenario(scenarioId)) {
    const rbac = runtime.files["rbac.yaml"] ?? "";
    const serviceAccount = runtime.files["serviceaccount.yaml"] ?? "";
    const output = [
      "LAST SEEN   TYPE      REASON                OBJECT                              MESSAGE",
    ];
    if (!eksRbacBindsCheckoutApi(rbac)) output.push("3m          Warning   FailedAuthorization   pod/checkout-api-5d9f6bbd76-zm9kq   RBAC denied configmaps get for system:serviceaccount:payments:checkout-api");
    if (!eksServiceAccountUsesPaymentsRole(serviceAccount)) output.push("2m          Warning   AccessDenied          pod/checkout-api-5d9f6bbd76-zm9kq   AWS role eks-default-readonly cannot access orders queue");
    if (output.length === 1) output.push("1m          Normal    Pulled                pod/checkout-api-5d9f6bbd76-zm9kq   Container image ghcr.io/acme/checkout-api:1.4.2 already present");
    return output;
  }

  if (isHelmValuesScenario(scenarioId)) {
    return [
      "LAST SEEN   TYPE      REASON      OBJECT                              MESSAGE",
      "2m          Warning   Unhealthy   pod/checkout-api-7f5f6c9f7b-r2lsk   Helm release rendered readiness probe on port 9090",
      "1m          Normal    Pulled      pod/checkout-api-7f5f6c9f7b-r2lsk   Container image ghcr.io/acme/checkout-api:1.4.2 already present",
    ];
  }

  if (isReadinessProbeScenario(scenarioId)) {
    return [
      "LAST SEEN   TYPE      REASON      OBJECT                              MESSAGE",
      "2m          Warning   Unhealthy   pod/checkout-api-6d7c9b7c9b-2q8xp   Readiness probe failed: connect refused on port 9090",
      "1m          Normal    Pulled      pod/checkout-api-6d7c9b7c9b-2q8xp   Container image ghcr.io/acme/checkout-api:1.4.2 already present",
    ];
  }

  if (isMemoryLimitScenario(scenarioId)) {
    return [
      "LAST SEEN   TYPE      REASON      OBJECT                              MESSAGE",
      "2m          Warning   OOMKilling  pod/checkout-api-74d6d5b969-nq2zp   Container checkout-api exceeded memory limit 128Mi",
      "1m          Warning   BackOff     pod/checkout-api-74d6d5b969-nq2zp   Back-off restarting failed container",
    ];
  }

  if (isHpaScalingScenario(scenarioId)) {
    return [
      "LAST SEEN   TYPE      REASON              OBJECT                    MESSAGE",
      "3m          Warning   FailedGetScale      hpa/checkout-api          current CPU 92%, maxReplicas 3 reached",
      "1m          Normal    SuccessfulRescale   hpa/checkout-api          desired replicas capped by maxReplicas",
    ];
  }

  if (isPdbNodeDrainScenario(scenarioId)) {
    return [
      "LAST SEEN   TYPE      REASON              OBJECT                    MESSAGE",
      "3m          Warning   DisruptionAllowed   pdb/checkout-api          maxUnavailable 3 permits all replicas to be evicted",
      "1m          Normal    NoPodsEvicted       node/ip-10-0-4-21         drain not started",
    ];
  }

  return [
    "LAST SEEN   TYPE      REASON    OBJECT                              MESSAGE",
    "2m          Warning   Failed    pod/checkout-api-6d7c9b7c9b-2q8xp   Failed to pull image: tag latest is not allowed",
    "2m          Warning   Failed    pod/checkout-api-6d7c9b7c9b-2q8xp   Approved immutable tag: ghcr.io/acme/checkout-api:1.4.2",
    "1m          Normal    BackOff   pod/checkout-api-6d7c9b7c9b-2q8xp   Back-off pulling image",
  ];
}

export function runKubectlLogs(runtime: Scenario, scenarioId: string): string[] {
  if (isEksRbacIrsaScenario(scenarioId)) {
    if (runtime.flags.kubernetesValidated) return ["loaded checkout-config from namespace payments", "sent order message to SQS queue orders"];
    const rbac = runtime.files["rbac.yaml"] ?? "";
    const serviceAccount = runtime.files["serviceaccount.yaml"] ?? "";
    const output = [];
    if (!eksRbacBindsCheckoutApi(rbac)) {
      output.push("ERROR kubernetes client: configmaps \"checkout-config\" is forbidden: User \"system:serviceaccount:payments:checkout-api\" cannot get resource \"configmaps\" in namespace \"payments\"");
    } else {
      output.push("loaded checkout-config from namespace payments");
    }
    if (!eksServiceAccountUsesPaymentsRole(serviceAccount)) {
      output.push("ERROR aws sdk: AccessDenied for sqs:SendMessage using role arn:aws:iam::111122223333:role/eks-default-readonly");
    } else {
      output.push("sent order message to SQS queue orders");
    }
    return output;
  }

  if (isHelmValuesScenario(scenarioId)) return ["checkout-api listening on :8080", "GET /healthz 200 OK"];
  if (isReadinessProbeScenario(scenarioId)) return ["checkout-api listening on :8080", "GET /healthz 200 OK"];
  if (isMemoryLimitScenario(scenarioId)) return ["checkout-api starting", "loaded 286 MiB product cache", "process terminated before readiness"];
  if (isHpaScalingScenario(scenarioId)) return ["checkout-api latency p95=1840ms", "worker pool saturated while CPU > 90%"];
  if (isPdbNodeDrainScenario(scenarioId)) return ["checkout-api serving traffic", "no application error; risk is planned voluntary disruption"];
  return runtime.flags.kubernetesValidated
    ? ["checkout-api listening on :8080"]
    : ["Error from server (BadRequest): container checkout-api is waiting to start: trying and failing to pull image"];
}

export function runKubectlGetHpa(runtime: Scenario, scenarioId: string): string[] {
  if (!isHpaScalingScenario(scenarioId)) return ["NAME           REFERENCE                 TARGETS   MINPODS   MAXPODS   REPLICAS", "checkout-api   Deployment/checkout-api   22%/60%   2         8         2"];

  runtime.flags.kubernetesEventsChecked = true;
  const hpa = runtime.files["hpa.yaml"] ?? "";
  if (hpaScalingPolicyIsFixed(hpa)) {
    const policy = parseHpaScalingPolicy(hpa);
    const minPods = policy?.minReplicas ?? 2;
    const maxPods = policy?.maxReplicas ?? 8;
    return [
      "NAME           REFERENCE                 TARGETS   MINPODS   MAXPODS   REPLICAS",
      `checkout-api   Deployment/checkout-api   ${hpaCurrentCpuDisplay(hpa)}   ${minPods}         ${maxPods}         ${hpaStableReplicaCount(hpa)}`,
    ];
  }

  return ["NAME           REFERENCE                 TARGETS   MINPODS   MAXPODS   REPLICAS", "checkout-api   Deployment/checkout-api   92%/90%   1         3         3"];
}

export function runKubectlDescribeHpa(runtime: Scenario, scenarioId: string): string[] {
  if (!isHpaScalingScenario(scenarioId)) return ["Name: checkout-api", "Reference: Deployment/checkout-api"];

  runtime.flags.validationPassed = true;
  const hpa = runtime.files["hpa.yaml"] ?? "";
  if (hpaScalingPolicyIsFixed(hpa)) {
    const policy = parseHpaScalingPolicy(hpa);
    return [
      "Name: checkout-api",
      `Min replicas: ${policy?.minReplicas ?? 2}`,
      `Max replicas: ${policy?.maxReplicas ?? 8}`,
      `Metric target: cpu ${policy?.averageUtilization ?? 60}%`,
      "Conditions: AbleToScale=True ScalingActive=True ScalingLimited=False",
    ];
  }

  return ["Name: checkout-api", "Min replicas: 1", "Max replicas: 3", "Metric target: cpu 90%", "Conditions: AbleToScale=True ScalingActive=True ScalingLimited=True", "Warning: desired replicas are capped by maxReplicas"];
}

export function runKubectlGetPdb(runtime: Scenario, scenarioId: string): string[] {
  if (!isPdbNodeDrainScenario(scenarioId)) return ["NAME           MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS", "checkout-api   N/A             1                 1"];

  runtime.flags.validationPassed = true;
  const pdb = runtime.files["pdb.yaml"] ?? "";
  if (pdbAllowsOneDisruption(pdb)) {
    return ["NAME           MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS", "checkout-api   N/A             1                 1"];
  }

  return ["NAME           MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS", "checkout-api   N/A             3                 3"];
}

export function runKubectlApplyManifest(runtime: Scenario, scenarioId: string, fileName?: string): string[] {
  if (isHpaScalingScenario(scenarioId)) {
    const hpa = runtime.files["hpa.yaml"] ?? "";
    if (fileName === "hpa.yaml" && runtime.flags.validationPassed && runtime.flags.kubernetesEventsChecked && hpaScalingPolicyIsFixed(hpa)) {
      const policy = parseHpaScalingPolicy(hpa);
      runtime.flags.cleanPlan = true;
      setFirstResource(runtime, "drifted", hpaScalingPolicySummary(hpa));
      runtime.stateResources = runtime.stateResources.map((resource) => {
        if (resource.address === "hpa.checkout-api.minReplicas") return { ...resource, id: String(policy?.minReplicas ?? 2) };
        if (resource.address === "hpa.checkout-api.maxReplicas") return { ...resource, id: String(policy?.maxReplicas ?? 8) };
        if (resource.address === "hpa.checkout-api.cpuTarget") return { ...resource, id: String(policy?.averageUtilization ?? 60) };
        return resource;
      });
      return ["horizontalpodautoscaler.autoscaling/checkout-api configured"];
    }

    setFirstResource(runtime, "failed", "HPA still has the wrong replica bounds or CPU target, or HPA state was not inspected first.");
    return ["horizontalpodautoscaler.autoscaling/checkout-api configured", hpaScalingPolicyFeedback(hpa)];
  }

  if (isPdbNodeDrainScenario(scenarioId)) {
    const pdb = runtime.files["pdb.yaml"] ?? "";
    if (fileName === "pdb.yaml" && runtime.flags.validationPassed && pdbAllowsOneDisruption(pdb)) {
      runtime.flags.cleanPlan = true;
      setFirstResource(runtime, "drifted", "PDB applied with maxUnavailable 1; verify planned drain.");
      runtime.stateResources = runtime.stateResources.map((resource) =>
        resource.address === "pdb.checkout-api.maxUnavailable" ? { ...resource, id: "1" } : resource,
      );
      return ["poddisruptionbudget.policy/checkout-api configured"];
    }

    setFirstResource(runtime, "failed", "PDB still allows too many voluntary disruptions or PDB state was not inspected first.");
    return ["poddisruptionbudget.policy/checkout-api configured", "warning: allowed disruptions still unsafe"];
  }

  return [`${fileName ?? "manifest"} applied`];
}

export function runKubectlDrainNode(runtime: Scenario, scenarioId: string): string[] {
  if (!isPdbNodeDrainScenario(scenarioId)) return ["node/ip-10-0-4-21 drained"];

  const pdb = runtime.files["pdb.yaml"] ?? "";
  if (runtime.flags.cleanPlan && runtime.flags.validationPassed && pdbAllowsOneDisruption(pdb)) {
    runtime.flags.kubernetesValidated = true;
    setFirstResource(runtime, "success", "Node drain respects checkout-api PDB and keeps at least two replicas available.");
    return ["node/ip-10-0-4-21 cordoned", "evicting pod checkout-api-7bd8dfc6d4-2q8xp", "cannot evict more checkout-api pods: PDB checkout-api requires at least 2 available", "node/ip-10-0-4-21 drained"];
  }

  setFirstResource(runtime, "failed", "Drain would allow too many checkout-api replicas to be evicted.");
  return ["node/ip-10-0-4-21 cordoned", "evicting pod checkout-api-7bd8dfc6d4-2q8xp", "evicting pod checkout-api-7bd8dfc6d4-5jv7m", "evicting pod checkout-api-7bd8dfc6d4-rp9kx", "warning: checkout-api capacity dropped below maintenance target"];
}

export function runKubectlAuthCanI(runtime: Scenario, scenarioId: string): string[] {
  if (!isEksRbacIrsaScenario(scenarioId)) return ["yes"];

  runtime.flags.validationPassed = true;
  const rbac = runtime.files["rbac.yaml"] ?? "";
  if (eksRbacBindsCheckoutApi(rbac)) {
    return ["yes", "system:serviceaccount:payments:checkout-api can get configmaps in namespace payments"];
  }

  return ["no", "RoleBinding checkout-api-reader grants checkout-worker, not checkout-api"];
}

export function runEksIamListRoles(runtime: Scenario, scenarioId: string): string[] {
  if (!isEksRbacIrsaScenario(scenarioId)) return ["Roles: []"];

  runtime.flags.validationPassed = true;
  return [
    "Roles:",
    "- RoleName: eks-default-readonly",
    "  Arn: arn:aws:iam::111122223333:role/eks-default-readonly",
    "  Path: /eks/shared/",
    "  Tags: namespace=default, app=shared, access=readonly",
    "- RoleName: eks-checkout-api-payments",
    "  Arn: arn:aws:iam::111122223333:role/eks-checkout-api-payments",
    "  Path: /eks/payments/",
    "  Tags: namespace=payments, app=checkout-api, access=orders-sqs",
    "- RoleName: eks-reports-batch",
    "  Arn: arn:aws:iam::111122223333:role/eks-reports-batch",
    "  Path: /eks/reports/",
    "  Tags: namespace=reports, app=reports, access=analytics-read",
  ];
}

export function runEksIamGetRole(runtime: Scenario, scenarioId: string, roleName?: string): string[] {
  if (!isEksRbacIrsaScenario(scenarioId)) return ["NoSuchEntity: this Kubernetes lab does not define EKS IRSA roles."];
  if (!roleName) return ["usage: aws iam get-role --role-name <name>"];

  runtime.flags.validationPassed = true;

  if (roleName === "eks-checkout-api-payments") {
    return [
      "Role:",
      "  RoleName: eks-checkout-api-payments",
      "  Arn: arn:aws:iam::111122223333:role/eks-checkout-api-payments",
      "  Path: /eks/payments/",
      "AssumeRolePolicyDocument:",
      "  Principal:",
      "    Federated: arn:aws:iam::111122223333:oidc-provider/oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E",
      "  Action: sts:AssumeRoleWithWebIdentity",
      "  Condition:",
      "    StringEquals:",
      "      oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:aud: sts.amazonaws.com",
      "      oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub: system:serviceaccount:payments:checkout-api",
      "AttachedPolicies:",
      "  - checkout-orders-producer",
      "PermissionsSummary:",
      "  Allow sqs:GetQueueUrl, sqs:SendMessage on arn:aws:sqs:eu-west-1:111122223333:orders",
    ];
  }

  if (roleName === "eks-default-readonly") {
    return [
      "Role:",
      "  RoleName: eks-default-readonly",
      "  Arn: arn:aws:iam::111122223333:role/eks-default-readonly",
      "  Path: /eks/shared/",
      "AssumeRolePolicyDocument:",
      "  Condition:",
      "    StringEquals:",
      "      oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub: system:serviceaccount:default:readonly",
      "PermissionsSummary:",
      "  Shared read-only AWS API access; no sqs:SendMessage permission for the orders queue.",
    ];
  }

  if (roleName === "eks-reports-batch") {
    return [
      "Role:",
      "  RoleName: eks-reports-batch",
      "  Arn: arn:aws:iam::111122223333:role/eks-reports-batch",
      "  Path: /eks/reports/",
      "AssumeRolePolicyDocument:",
      "  Condition:",
      "    StringEquals:",
      "      oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E:sub: system:serviceaccount:reports:reports-batch",
      "PermissionsSummary:",
      "  Analytics read access only.",
    ];
  }

  return [`NoSuchEntity: The role with name ${roleName} cannot be found.`];
}

export function runEksAssumeRoleWithWebIdentity(runtime: Scenario, scenarioId: string): string[] {
  if (!isEksRbacIrsaScenario(scenarioId)) return ["AssumeRoleWithWebIdentity skipped: this Kubernetes lab does not use EKS IRSA."];

  const serviceAccount = runtime.files["serviceaccount.yaml"] ?? "";
  if (eksServiceAccountUsesPaymentsRole(serviceAccount)) {
    runtime.flags.securityPassed = true;
    return [
      "Token issuer: oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E",
      "sub: system:serviceaccount:payments:checkout-api",
      "AssumeRoleWithWebIdentity: allowed",
      "RoleArn: arn:aws:iam::111122223333:role/eks-checkout-api-payments",
    ];
  }

  setFirstResource(runtime, "failed", "ServiceAccount still points at eks-default-readonly instead of the approved payments IRSA role.");
  return [
    "Token issuer: oidc.eks.eu-west-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E",
    "sub: system:serviceaccount:payments:checkout-api",
    "AssumeRoleWithWebIdentity: denied",
    "Finding: ServiceAccount annotation uses arn:aws:iam::111122223333:role/eks-default-readonly",
  ];
}

export function runKubectlRolloutRestart(runtime: Scenario, scenarioId: string): string[] {
  const deployment = runtime.files["deployment.yaml"] ?? "";
  if (isHpaScalingScenario(scenarioId)) {
    const hpa = runtime.files["hpa.yaml"] ?? "";
    if (runtime.flags.cleanPlan && hpaScalingPolicyIsFixed(hpa)) {
      return ["deployment.apps/checkout-api restarted", "note: HPA policy is already applied; verify rollout status."];
    }

    return ["deployment.apps/checkout-api restarted", "rollout status: pending. Apply the HPA scaling policy before verifying rollout."];
  }

  if (isEksRbacIrsaScenario(scenarioId)) {
    const rbac = runtime.files["rbac.yaml"] ?? "";
    const serviceAccount = runtime.files["serviceaccount.yaml"] ?? "";
    if (runtime.flags.validationPassed && runtime.flags.securityPassed && eksRbacBindsCheckoutApi(rbac) && eksServiceAccountUsesPaymentsRole(serviceAccount)) {
      runtime.flags.cleanPlan = true;
      setFirstResource(runtime, "drifted", "Rollout restarted after RBAC and IRSA were aligned to checkout-api.");
      return ["deployment.apps/checkout-api restarted"];
    }

    setFirstResource(runtime, "failed", "Rollout still has a broken RoleBinding subject, a wrong IRSA role, or missing validation checks.");
    return ["deployment.apps/checkout-api restarted", "rollout status: authorization checks still failing"];
  }

  if (isReadinessProbeScenario(scenarioId)) {
    if (runtime.flags.validationPassed && runtime.flags.kubernetesEventsChecked && readinessProbeUsesAppPort(deployment)) {
      runtime.flags.cleanPlan = true;
      setFirstResource(runtime, "drifted", "Rollout restarted with the readiness probe using the application port; verify rollout status and scale.");
      return ["deployment.apps/checkout-api restarted"];
    }

    setFirstResource(runtime, "failed", "Rollout still has a readiness probe port mismatch or pod events were not inspected first.");
    return ["deployment.apps/checkout-api restarted", "rollout status: waiting for ready replicas"];
  }

  if (isMemoryLimitScenario(scenarioId)) {
    if (runtime.flags.validationPassed && runtime.flags.kubernetesEventsChecked && memoryLimitIsRaised(deployment)) {
      runtime.flags.cleanPlan = true;
      setFirstResource(runtime, "drifted", "Rollout restarted with memory limit 512Mi; verify rollout status.");
      return ["deployment.apps/checkout-api restarted"];
    }

    setFirstResource(runtime, "failed", "Rollout still has an unsafe memory limit or pod events were not inspected first.");
    return ["deployment.apps/checkout-api restarted", "rollout status: CrashLoopBackOff after OOMKilled"];
  }

  if (runtime.flags.validationPassed && runtime.flags.kubernetesEventsChecked && deployment.includes("ghcr.io/acme/checkout-api:1.4.2")) {
    runtime.flags.cleanPlan = true;
    setFirstResource(runtime, "drifted", "Rollout restarted with the approved image; verify rollout status and scale.");
    return ["deployment.apps/checkout-api restarted"];
  }

  setFirstResource(runtime, "failed", "Rollout still uses the rejected latest image tag or pod events were not inspected first.");
  return ["deployment.apps/checkout-api restarted", "rollout status: ImagePullBackOff"];
}

export function runKubectlScale(runtime: Scenario): string[] {
  const deployment = runtime.files["deployment.yaml"] ?? "";
  if (!deployment.includes("replicas: 2")) {
    runtime.files["deployment.yaml"] = deployment.replace("replicas: 1", "replicas: 2");
  }
  runtime.flags.lintPassed = true;
  runtime.stateResources = runtime.stateResources.map((resource) =>
    resource.address === "deployment.checkout-api.replicas" ? { ...resource, id: "2" } : resource,
  );
  return ["deployment.apps/checkout-api scaled", "replicas: 2"];
}

export function runKubectlRolloutStatus(runtime: Scenario, scenarioId: string): string[] {
  const deployment = runtime.files["deployment.yaml"] ?? "";
  if (isEksRbacIrsaScenario(scenarioId)) {
    const rbac = runtime.files["rbac.yaml"] ?? "";
    const serviceAccount = runtime.files["serviceaccount.yaml"] ?? "";
    if (runtime.flags.cleanPlan && runtime.flags.validationPassed && runtime.flags.securityPassed && eksRbacBindsCheckoutApi(rbac) && eksServiceAccountUsesPaymentsRole(serviceAccount)) {
      runtime.flags.kubernetesValidated = true;
      setFirstResource(runtime, "success", "checkout-api uses the payments ServiceAccount RBAC binding and assumes the approved EKS IRSA role.");
      runtime.stateResources = runtime.stateResources.map((resource) => {
        if (resource.address === "serviceaccount.payments.checkout-api.irsa") return { ...resource, id: "eks-checkout-api-payments" };
        if (resource.address === "rolebinding.payments.checkout-api-reader.subject") return { ...resource, id: "checkout-api" };
        if (resource.address === "deployment.checkout-api.rollout") return { ...resource, id: "Ready" };
        return resource;
      });
      return ["Waiting for deployment checkout-api rollout to finish...", "deployment \"checkout-api\" successfully rolled out"];
    }

    return ["Waiting for deployment checkout-api rollout to finish...", "rollout status: pending. Verify RBAC, IRSA, and restart the deployment."];
  }

  if (isHelmValuesScenario(scenarioId)) {
    const values = runtime.files["values.yaml"] ?? "";
    if (runtime.flags.cleanPlan && runtime.flags.validationPassed && helmValuesUseAppPort(values)) {
      runtime.flags.kubernetesValidated = true;
      setFirstResource(runtime, "success", "Helm release renders containerPort 8080 and the checkout-api rollout is healthy.");
      runtime.stateResources = runtime.stateResources.map((resource) => {
        if (resource.address === "values.checkout-api.containerPort") return { ...resource, id: "8080" };
        if (resource.address === "deployment.checkout-api.rollout") return { ...resource, id: "Ready" };
        return resource;
      });
      return ["Waiting for deployment checkout-api rollout to finish...", "deployment \"checkout-api\" successfully rolled out"];
    }

    return ["Waiting for deployment checkout-api rollout to finish...", "rollout status: pending. Render the chart, fix values.yaml, and run helm upgrade."];
  }

  if (isReadinessProbeScenario(scenarioId)) {
    if (runtime.flags.cleanPlan && runtime.flags.lintPassed && readinessProbeUsesAppPort(deployment)) {
      runtime.flags.kubernetesValidated = true;
      setFirstResource(runtime, "success", "Deployment readiness probe uses the app port, rollout is healthy, and replicas are scaled to 2.");
      runtime.stateResources = runtime.stateResources.map((resource) => {
        if (resource.address === "pod.checkout-api") return { ...resource, id: "Ready" };
        if (resource.address === "probe.checkout-api.readiness") return { ...resource, id: "port-8080" };
        return resource;
      });
      return ["Waiting for deployment checkout-api rollout to finish...", "deployment \"checkout-api\" successfully rolled out"];
    }

    return ["Waiting for deployment checkout-api rollout to finish...", "rollout status: pending. Restart rollout and scale deployment after fixing the readiness probe."];
  }

  if (isMemoryLimitScenario(scenarioId)) {
    if (runtime.flags.cleanPlan && memoryLimitIsRaised(deployment)) {
      runtime.flags.kubernetesValidated = true;
      setFirstResource(runtime, "success", "Deployment memory limit is 512Mi and rollout is healthy after OOM triage.");
      runtime.stateResources = runtime.stateResources.map((resource) => {
        if (resource.address === "pod.checkout-api") return { ...resource, id: "Running" };
        if (resource.address === "resources.checkout-api.memoryLimit") return { ...resource, id: "512Mi" };
        return resource;
      });
      return ["Waiting for deployment checkout-api rollout to finish...", "deployment \"checkout-api\" successfully rolled out"];
    }

    return ["Waiting for deployment checkout-api rollout to finish...", "rollout status: pending. Raise the memory limit and restart rollout after inspecting OOM events."];
  }

  if (isHpaScalingScenario(scenarioId)) {
    const hpa = runtime.files["hpa.yaml"] ?? "";
    if (runtime.flags.cleanPlan && hpaScalingPolicyIsFixed(hpa)) {
      runtime.flags.kubernetesValidated = true;
      setFirstResource(runtime, "success", hpaScalingPolicySuccessMessage(hpa));
      return [
        "Waiting for deployment checkout-api rollout to finish...",
        "deployment \"checkout-api\" successfully rolled out",
        `hpa checkout-api stabilized at ${hpaStableReplicaCount(hpa)} replicas`,
      ];
    }

    return ["Waiting for deployment checkout-api rollout to finish...", "rollout status: pending. Inspect and apply the HPA scaling policy."];
  }

  if (runtime.flags.cleanPlan && runtime.flags.lintPassed && deployment.includes("ghcr.io/acme/checkout-api:1.4.2")) {
    runtime.flags.kubernetesValidated = true;
    setFirstResource(runtime, "success", "Deployment uses the approved image, rollout is healthy, and replicas are scaled to 2.");
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "pod.checkout-api" ? { ...resource, id: "Running" } : resource,
    );
    return ["Waiting for deployment checkout-api rollout to finish...", "deployment \"checkout-api\" successfully rolled out"];
  }

  return ["Waiting for deployment checkout-api rollout to finish...", "rollout status: pending. Restart rollout and scale deployment after fixing the image."];
}

export function runHelmLint(runtime: Scenario, scenarioId: string): string[] {
  if (!isHelmValuesScenario(scenarioId)) return ["==> Linting checkout", "1 chart(s) linted, 0 chart(s) failed"];

  runtime.flags.kubernetesEventsChecked = true;
  const values = runtime.files["values.yaml"] ?? "";
  if (helmValuesUseAppPort(values)) {
    return ["==> Linting checkout", "[INFO] values.yaml: containerPort matches the application port 8080", "1 chart(s) linted, 0 chart(s) failed"];
  }

  return [
    "==> Linting checkout",
    "[WARNING] values.yaml: containerPort is 9090, but checkout-api appVersion 1.4.2 exposes /healthz on 8080",
    "1 chart(s) linted, 0 chart(s) failed",
  ];
}

export function runHelmTemplate(runtime: Scenario, scenarioId: string): string[] {
  if (!isHelmValuesScenario(scenarioId)) return ["---", "# Source: checkout/templates/deployment.yaml", "kind: Deployment"];

  runtime.flags.validationPassed = true;
  const values = runtime.files["values.yaml"] ?? "";
  const containerPort = helmValuesUseAppPort(values) ? "8080" : "9090";
  return [
    "---",
    "# Source: checkout-api/templates/deployment.yaml",
    "kind: Deployment",
    "metadata:",
    "  name: checkout-api",
    "spec:",
    "  template:",
    "    spec:",
    "      containers:",
    "        - name: checkout-api",
    "          image: ghcr.io/acme/checkout-api:1.4.2",
    "          ports:",
    `            - containerPort: ${containerPort}`,
    "          readinessProbe:",
    "            httpGet:",
    "              path: /healthz",
    `              port: ${containerPort}`,
    "---",
    "# Source: checkout-api/templates/service.yaml",
    "kind: Service",
    "spec:",
    "  ports:",
    "    - port: 80",
    `      targetPort: ${containerPort}`,
  ];
}

export function runHelmUpgrade(runtime: Scenario, scenarioId: string): string[] {
  if (!isHelmValuesScenario(scenarioId)) return ["Release \"checkout\" has been upgraded."];

  const values = runtime.files["values.yaml"] ?? "";
  if (runtime.flags.validationPassed && runtime.flags.kubernetesEventsChecked && helmValuesUseAppPort(values)) {
    runtime.flags.cleanPlan = true;
    setFirstResource(runtime, "drifted", "Helm release upgraded with containerPort 8080; verify rollout status.");
    return ["Release \"checkout\" has been upgraded.", "NAMESPACE: default", "STATUS: deployed"];
  }

  setFirstResource(runtime, "failed", "Helm upgrade still renders the wrong container port or chart output was not inspected first.");
  return ["Release \"checkout\" has been upgraded.", "STATUS: deployed", "rollout status: waiting for ready replicas"];
}

export function kubernetesBlankValidate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "kubernetesBlankDeploymentService") {
    return ["No blank Kubernetes scenario configured."];
  }
  const file = runtime.files["deployment.yaml"] ?? "";
  const hasDeployment = file.includes("kind: Deployment");
  const hasService = file.includes("kind: Service");
  const hasNginxImage = file.includes("nginx:1.25");
  const hasReplicas2 = /replicas:\s*2\b/.test(file);
  const hasContainerPort80 = /containerPort:\s*80\b/.test(file);
  const hasClusterIP = file.includes("type: ClusterIP");
  const hasTargetPort80 = /targetPort:\s*80\b/.test(file);
  const hasPort80 = /port:\s*80\b/.test(file);

  if (hasDeployment && hasService && hasNginxImage && hasReplicas2 && hasContainerPort80 && hasClusterIP && hasTargetPort80 && hasPort80) {
    runtime.flags.kubernetesValidated = true;
    setFirstResource(runtime, "success", "Deployment and Service YAML is valid. Configuration meets all requirements.");
    return [
      "deployment.apps/web created (server dry run)",
      "service/web created (server dry run)",
      "Validation passed: Deployment with nginx:1.25, 2 replicas, port 80, and ClusterIP Service.",
    ];
  }

  const missing: string[] = [];
  if (!hasDeployment) missing.push("kind: Deployment");
  if (!hasService) missing.push("kind: Service");
  if (!hasNginxImage) missing.push("nginx:1.25 image");
  if (!hasReplicas2) missing.push("replicas: 2");
  if (!hasContainerPort80) missing.push("containerPort: 80");
  if (!hasClusterIP) missing.push("type: ClusterIP");
  if (!hasTargetPort80) missing.push("targetPort: 80");
  if (!hasPort80) missing.push("port: 80");

  setFirstResource(runtime, "failed", `YAML still missing: ${missing.join(", ")}.`);
  return [`Error from server (dry run): resource validation failed.`, `Missing: ${missing.join(", ")}.`];
}
