<script lang="ts">
  import LabGroupIcon from "./LabGroupIcon.svelte";
  import { labGroupDetails, type LabGroup, type MenuGroupId } from "./labCatalog";

  interface Props {
    labGroups: LabGroup[];
    groupcompletionlabel: (ids: string[]) => string;
    onopenlabgroup: (group: MenuGroupId) => void;
  }

  let { labGroups, groupcompletionlabel, onopenlabgroup }: Props = $props();

  function providerClass(provider: string): string {
    return `provider-${provider.toLowerCase()}`;
  }
</script>

<section class="lab-index" aria-label="Lab index">
  <p class="lab-index-intro">
    Remember the <span>basics</span>. Practice <span class="pill-mauve">hands-on</span>.
  </p>
  {#each labGroups as group}
    <button type="button" class="lab-index-card" onclick={() => onopenlabgroup(group.id)}>
      <span class="lab-index-icon" aria-hidden="true">
        <LabGroupIcon id={group.id} />
      </span>
      <span class="lab-index-content">
        <strong>{group.title}</strong>
        <span class="lab-index-providers">
          {#each labGroupDetails[group.id].providers as provider}
            <span class={providerClass(provider)}>{provider}</span>
          {/each}
        </span>
        <small>{labGroupDetails[group.id].description}</small>
      </span>
      <span class="lab-index-count">{groupcompletionlabel(group.ids)}</span>
    </button>
  {/each}
</section>
