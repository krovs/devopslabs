<script lang="ts">
  import { contextualDocumentationSections, type DocInline } from "./docs";
  import type { Scenario } from "./types";

  interface Props {
    kind: Scenario["kind"];
    onclose: () => void;
  }

  let { kind, onclose }: Props = $props();
  let referenceSections = $derived(contextualDocumentationSections(kind));

  function isCode(part: DocInline): part is { code: string } {
    return typeof part !== "string";
  }
</script>

{#snippet inlineContent(content: DocInline[])}
  {#each content as part}
    {#if isCode(part)}
      <code>{part.code}</code>
    {:else}
      {part}
    {/if}
  {/each}
{/snippet}

<button class="docs-backdrop" type="button" aria-label="Close documentation" onclick={onclose}></button>
<div class="docs-window" role="dialog" aria-modal="true" aria-labelledby="docs-window-title">
  <header class="docs-window-header">
    <h2 id="docs-window-title">Reference</h2>
    <button type="button" class="menu-close-button" aria-label="Close documentation" onclick={onclose}>×</button>
  </header>

  <div class="wiki-layout" aria-label="Documentation">
    <article class="wiki-article">
      {#each referenceSections as section}
        <section id={section.id}>
          <h2>{section.title}</h2>

          {#each section.blocks as block}
          {#if block.type === "paragraph"}
            <p>{@render inlineContent(block.content)}</p>
          {:else if block.type === "orderedList"}
            <ol>
              {#each block.items as item}
                <li>{@render inlineContent(item)}</li>
              {/each}
            </ol>
          {:else if block.type === "unorderedList"}
            <ul>
              {#each block.items as item}
                <li>{@render inlineContent(item)}</li>
              {/each}
            </ul>
          {:else if block.type === "heading"}
            <h3>{block.text}</h3>
          {:else if block.type === "code"}
            <pre>{block.text}</pre>
          {:else if block.type === "table"}
            <div class="wiki-table-wrap">
              <table>
                <thead>
                  <tr>
                    {#each block.headers as header}
                      <th>{header}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each block.rows as row}
                    <tr>
                      {#each row as cell}
                        <td>{@render inlineContent(cell)}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if block.type === "diagram"}
            <div class="wiki-diagram" aria-label={block.ariaLabel}>
              {#each block.nodes as node, index}
                <div class="diagram-node">{node.title}<br /><span>{node.detail}</span></div>
                {#if index < block.nodes.length - 1}
                  <div class="diagram-arrow">-&gt;</div>
                {/if}
              {/each}
            </div>
          {:else if block.type === "tree"}
            <div class="tree-diagram" aria-label={block.ariaLabel}>
              {#each block.rows as row}
                <div class={`tree-row tree-${row.kind}`}><code>{row.code}</code><span>{row.text}</span></div>
              {/each}
            </div>
          {/if}
        {/each}
      </section>
    {/each}
  </article>
  </div>
</div>
