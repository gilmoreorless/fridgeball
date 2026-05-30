<script lang="ts">
  import '../node_modules/flag-icons/css/flag-icons.min.css';
  import { tournaments } from './lib/tournaments';
  import type { MatchData } from './lib/Match.svelte';
  import Schedule from './Schedule.svelte';

  let currentTournament = $state(Object.keys(tournaments)[0]);
  const tournamentMatchesCache = new Map<string, MatchData[]>();

  async function loadData(key: string) {
    if (tournamentMatchesCache.has(key)) {
      return tournamentMatchesCache.get(key)!;
    }

    const rawData: string = (await import(`./assets/${key}.tsv?raw`)).default;

    const matchDateTimes = new Set<string>();
    const matches: MatchData[] = rawData
      .split('\n')
      .filter(line => line.length > 1 && !line.startsWith('Match'))
      .map(line => {
        const [
          matchNum,
          round,
          dateTime,
          team1,
          team2,
          location,
        ] = line.split('\t');
        const isDoubleTime = matchDateTimes.has(dateTime);
        matchDateTimes.add(dateTime);
        const date = new Date(dateTime);
        return {
          matchNum: +matchNum,
          round,
          date,
          baseDate: date,
          team1,
          team2,
          isDoubleTime,
          location,
        };
      });

    tournamentMatchesCache.set(key, matches);
    return matches;
  }

  let matches: Promise<MatchData[]> = $derived(loadData(currentTournament));

  // Testing only!
  const localOffset = new Date().getTimezoneOffset() / 60 * -1;
  let debugZone = $state(localOffset);
</script>

<main>
  <div class="options">
    <label for="tournament">Tournament:</label>
    <select id="tournament" bind:value={currentTournament}>
      {#each Object.entries(tournaments) as tournament}
        <option value={tournament[0]}>{tournament[1]}</option>
      {/each}
    </select>
  </div>
  <div class="debug-controls">
    <label for="debug-time-zone"><strong>[DEBUG]</strong> Time zone UTC offset (hours):</label>
    <input type="number" id="debug-time-zone" bind:value={debugZone} min="-14" max="14">
  </div>

  <svelte:boundary>
    <Schedule matches={await matches} {debugZone} />

    {#snippet pending()}
      <p class="loading">Loading schedule&hellip;</p>
    {/snippet}
  </svelte:boundary>
</main>

<style>
  .debug-controls {
    display: none;
  }
  :global(body.debug) .debug-controls {
    --debug-colour: lightcoral;

    display: block;
    position: fixed;
    left: 22cm;

    font-size: 1.5em;
    background-color: color-mix(in srgb, var(--debug-colour), white 70%);
    border: 2px dashed color-mix(in srgb, var(--debug-colour), black 10%);
    padding: 1em;
  }
  .debug-controls strong {
    display: block;
  }
  .debug-controls input {
    font-size: inherit;
    display: block;
    width: 5em;
  }

  .loading {
    font-size: 2rem;
    font-style: italic;
  }
</style>
