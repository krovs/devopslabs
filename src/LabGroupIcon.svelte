<script lang="ts">
  import CertificateCheck from "carbon-icons-svelte/lib/CertificateCheck.svelte";
  import ChartLineData from "carbon-icons-svelte/lib/ChartLineData.svelte";
  import CloudAuditing from "carbon-icons-svelte/lib/CloudAuditing.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import ContinuousDeployment from "carbon-icons-svelte/lib/ContinuousDeployment.svelte";
  import Cost from "carbon-icons-svelte/lib/Cost.svelte";
  import DocumentTasks from "carbon-icons-svelte/lib/DocumentTasks.svelte";
  import Firewall from "carbon-icons-svelte/lib/Firewall.svelte";
  import FlowLogsVpc from "carbon-icons-svelte/lib/FlowLogsVpc.svelte";
  import FolderTree from "carbon-icons-svelte/lib/FolderTree.svelte";
  import GitRepo from "carbon-icons-svelte/lib/GitRepo.svelte";
  import GroupSecurity from "carbon-icons-svelte/lib/GroupSecurity.svelte";
  import IbmSecurity from "carbon-icons-svelte/lib/IbmSecurity.svelte";
  import type { MenuGroupId } from "./labCatalog";

  let { id, size = 32 }: { id: MenuGroupId; size?: number } = $props();
</script>

{#if id === "terraform"}
  <Code {size} />
{:else if id === "awsconfig"}
  <CloudAuditing {size} />
{:else if id === "cicd"}
  <ContinuousDeployment {size} />
{:else if id === "gitops"}
  <GitRepo {size} />
{:else if id === "terragrunt"}
  <FolderTree {size} />
{:else if id === "iam"}
  <GroupSecurity {size} />
{:else if id === "scp"}
  <IbmSecurity {size} />
{:else if id === "policy"}
  <DocumentTasks {size} />
{:else if id === "secrets"}
  <CertificateCheck {size} />
{:else if id === "dns"}
  <FlowLogsVpc {size} />
{:else if id === "observability"}
  <ChartLineData {size} />
{:else if id === "finops"}
  <Cost {size} />
{:else if id === "pr"}
  <DocumentTasks {size} />
{:else}
  <Firewall {size} />
{/if}
