<script lang="ts">
  import CertificateCheck from "carbon-icons-svelte/lib/CertificateCheck.svelte";
  import ChartLineData from "carbon-icons-svelte/lib/ChartLineData.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import ApplicationWeb from "carbon-icons-svelte/lib/ApplicationWeb.svelte";
  import CloudAuditing from "carbon-icons-svelte/lib/CloudAuditing.svelte";
  import DocumentTasks from "carbon-icons-svelte/lib/DocumentTasks.svelte";
  import Firewall from "carbon-icons-svelte/lib/Firewall.svelte";
  import FlowLogsVpc from "carbon-icons-svelte/lib/FlowLogsVpc.svelte";
  import FolderTree from "carbon-icons-svelte/lib/FolderTree.svelte";
  import GitRepo from "carbon-icons-svelte/lib/GitRepo.svelte";
  import GroupSecurity from "carbon-icons-svelte/lib/GroupSecurity.svelte";
  import IbmCloudHyperProtectDbaas from "carbon-icons-svelte/lib/IbmCloudHyperProtectDbaas.svelte";
  import IbmSecurity from "carbon-icons-svelte/lib/IbmSecurity.svelte";
  import LinuxAlt from "carbon-icons-svelte/lib/LinuxAlt.svelte";
  import LogoKubernetes from "carbon-icons-svelte/lib/LogoKubernetes.svelte";
  import Merge from "carbon-icons-svelte/lib/Merge.svelte";
  import Network_3 from "carbon-icons-svelte/lib/Network_3.svelte";
  import Pipelines from "carbon-icons-svelte/lib/Pipelines.svelte";
  import PiggyBank from "carbon-icons-svelte/lib/PiggyBank.svelte";
  import type { MenuGroupId } from "./labCatalog";

  let { id, size = 32 }: { id: MenuGroupId; size?: number } = $props();
</script>

{#if id === "terraform"}
  <Code {size} />
{:else if id === "awsconfig"}
  <IbmCloudHyperProtectDbaas {size} />
{:else if id === "cicd"}
  <Pipelines {size} />
{:else if id === "gitops"}
  <GitRepo {size} />
{:else if id === "linux"}
  <LinuxAlt {size} />
{:else if id === "kubernetes"}
  <LogoKubernetes {size} />
{:else if id === "appsec"}
  <ApplicationWeb {size} />
{:else if id === "cloudsec"}
  <CloudAuditing {size} />
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
  <PiggyBank {size} />
{:else if id === "pr"}
  <Merge {size} />
{:else if id === "networking"}
  <Network_3 {size} />
{:else}
  <Firewall {size} />
{/if}
