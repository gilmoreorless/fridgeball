<script lang="ts">
  import '../node_modules/flag-icons/css/flag-icons.min.css';
  import { tournaments } from './lib/tournaments';
  import type { MatchData } from './lib/Match.svelte';
  import Schedule from './Schedule.svelte';

  type TournamentKey = keyof typeof tournaments;

  let currentTournament = $state(Object.keys(tournaments)[0]) as TournamentKey;
  const tournamentMatchesCache = new Map<string, MatchData[]>();

  async function loadData(key: TournamentKey) {
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

  // Debugging controls only
  let showDebug = $state(false);
  const localOffset = new Date().getTimezoneOffset() / 60 * -1;
  let debugZone = $state(localOffset);
  let highlightTeam = $state('');
  let availableTeams = $derived.by(async () => {
    let teams = new Set();

    const validTeam = /^[A-Z]{3}$/;
    const addTeam = (team: string) => {
      if (validTeam.test(team)) {
        teams.add(team);
      }
    };
    for (let match of await matches) {
      addTeam(match.team1);
      addTeam(match.team2);
    }

    return Array.from(teams).sort();
  });
</script>

<main class="app {showDebug ? 'debug' : ''}">
  <div class="options">
    <input type="checkbox" id="debug-mode" bind:checked={showDebug}>
    <label for="debug-mode">Show debugging controls</label>
  </div>

  <svelte:boundary>
    <h1 class="title">{tournaments[currentTournament]} schedule</h1>
    <Schedule matches={await matches} {highlightTeam} {debugZone} />

    {#snippet pending()}
      <p class="loading">Loading schedule&hellip;</p>
    {/snippet}
  </svelte:boundary>

  <div class="debug-controls">
    <h2>[DEBUG]</h2>

    <div class="debug-option">
      <label for="debug-tournament">Tournament:</label>
      <select id="debug-tournament" bind:value={currentTournament}>
        {#each Object.entries(tournaments) as tournament}
          <option value={tournament[0]}>{tournament[1]}</option>
        {/each}
      </select>
    </div>

    <div class="debug-option">
      <label for="debug-team-highlight">Highlight team:</label>
      <select id="debug-team-highlight" bind:value={highlightTeam}>
        <option value="">(none)</option>
        {#each await availableTeams as team}
          <option value={team}>{team}</option>
        {/each}
      </select>
    </div>

    <div class="debug-option">
      <label for="debug-time-zone">Time zone UTC offset (hours):</label>
      <input type="number" id="debug-time-zone" bind:value={debugZone} min="-14" max="14">
    </div>
  </div>
</main>

<style>
  .app {
    margin: 0;
    padding: 2rem;
  }

  .loading {
    font-size: 2rem;
    font-style: italic;
  }

  .title {
    font-size: 1.8rem;
  }

  .options {
    float: right;
    margin-top: 2rem;
  }

  /*** Print-only styles ***/

  @media print {
    .options {
      display: none;
    }
  }

  @page {
    margin: 2rem 0;
  }
  @page :first {
    margin-top: 0;
  }

  /*** Debug section: Add `debug` class to show red lines marking A4 portrait pages ***/

  .debug-controls {
    display: none;
  }

  @media screen {
    .app.debug {
      outline: 1px solid red;
      width: 21cm;
      background-image: linear-gradient(to bottom, transparent 0 calc(100% - 1px), red 0 100%);
      background-size: 100% 29.7cm;
    }
    .app.debug .debug-controls {
      --debug-colour: lightcoral;

      display: block;
      position: fixed;
      left: 22cm;
      top: 4rem;

      font-size: 1.5em;
      background-color: color-mix(in srgb, var(--debug-colour), white 70%);
      border: 2px dashed color-mix(in srgb, var(--debug-colour), black 10%);
      padding: 1em;
    }

    .debug-controls h2 {
      font-size: 1em;
      margin: 0;
    }

    .debug-option {
      margin-top: 0.75em;

      input, select {
        font-size: inherit;
        display: block;
        width: 100%;
      }

      input[type="number"] {
        width: 5em;
      }
    }
  }
</style>
