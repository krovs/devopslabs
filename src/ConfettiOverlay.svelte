<script lang="ts">
  export type ConfettiPiece = {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    rotation: number;
    drift: number;
  };

  interface Props {
    pieces: ConfettiPiece[];
  }

  let { pieces }: Props = $props();
</script>

{#if pieces.length}
  <div class="confetti-layer" aria-hidden="true">
    {#each pieces as piece (piece.id)}
      <span
        class="confetti-piece"
        style={`
          --left: ${piece.left}vw;
          --delay: ${piece.delay}s;
          --duration: ${piece.duration}s;
          --size: ${piece.size}px;
          --color: ${piece.color};
          --rotation: ${piece.rotation}deg;
          --drift: ${piece.drift}px;
        `}
      ></span>
    {/each}
  </div>
{/if}
