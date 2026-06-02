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
  return ["web.service - demo web service", "Active: failed", "Result: exit-code", "Hint: check app.log and service.env"];
}

export function runLinuxSystemctlRestart(runtime: Scenario): string[] {
  const env = runtime.files["service.env"] ?? "";
  if (env.includes("PORT=8080") && runtime.flags.validationPassed && runtime.flags.linuxResourcesChecked) {
    runtime.flags.linuxValidated = true;
    setFirstResource(runtime, "success", "Service starts after logs and system resources were checked and PORT was restored.");
    return ["Restarting web.service...", "web.service is active (running)."];
  }

  setFirstResource(runtime, "failed", "Service restart still fails because PORT is missing or basic system checks were skipped.");
  return ["Restarting web.service...", "web.service failed. Check logs plus memory, disk, processes, and service environment."];
}

function isReadinessProbeScenario(scenarioId: string): boolean {
  return scenarioId === "kubernetesReadinessProbePort";
}

function readinessProbeUsesAppPort(deployment: string): boolean {
  return /readinessProbe:[\s\S]*httpGet:[\s\S]*port: 8080/.test(deployment);
}

export function runKubectlGetPods(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;
  if (runtime.flags.kubernetesValidated) return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-6d7c9b7c9b-2q8xp   1/1     Running   0"];
  if (isReadinessProbeScenario(scenarioId)) return ["NAME                            READY   STATUS    RESTARTS", "checkout-api-6d7c9b7c9b-2q8xp   0/1     Running   0"];
  return ["NAME                            READY   STATUS             RESTARTS", "checkout-api-6d7c9b7c9b-2q8xp   0/1     ImagePullBackOff   4"];
}

export function runKubectlDescribePod(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.validationPassed = true;
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
  if (isReadinessProbeScenario(scenarioId)) {
    return [
      "LAST SEEN   TYPE      REASON      OBJECT                              MESSAGE",
      "2m          Warning   Unhealthy   pod/checkout-api-6d7c9b7c9b-2q8xp   Readiness probe failed: connect refused on port 9090",
      "1m          Normal    Pulled      pod/checkout-api-6d7c9b7c9b-2q8xp   Container image ghcr.io/acme/checkout-api:1.4.2 already present",
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
  if (isReadinessProbeScenario(scenarioId)) return ["checkout-api listening on :8080", "GET /healthz 200 OK"];
  return runtime.flags.kubernetesValidated
    ? ["checkout-api listening on :8080"]
    : ["Error from server (BadRequest): container checkout-api is waiting to start: trying and failing to pull image"];
}

export function runKubectlRolloutRestart(runtime: Scenario, scenarioId: string): string[] {
  const deployment = runtime.files["deployment.yaml"] ?? "";
  if (isReadinessProbeScenario(scenarioId)) {
    if (runtime.flags.validationPassed && runtime.flags.kubernetesEventsChecked && readinessProbeUsesAppPort(deployment)) {
      runtime.flags.cleanPlan = true;
      setFirstResource(runtime, "drifted", "Rollout restarted with the readiness probe using the application port; verify rollout status and scale.");
      return ["deployment.apps/checkout-api restarted"];
    }

    setFirstResource(runtime, "failed", "Rollout still has a readiness probe port mismatch or pod events were not inspected first.");
    return ["deployment.apps/checkout-api restarted", "rollout status: waiting for ready replicas"];
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
