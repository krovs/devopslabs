<script lang="ts">
  import { documentationSections, type DocInline } from "./docs";

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

<section class="wiki-layout" aria-label="Documentation">
  <nav class="wiki-toc" aria-label="Documentation sections">
    {#each documentationSections as section}
      <a href={`#${section.id}`}>{section.navTitle}</a>
    {/each}
  </nav>

  <article class="wiki-article">
    {#each documentationSections as section}
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
</section>
