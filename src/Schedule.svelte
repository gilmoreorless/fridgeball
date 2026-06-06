<script lang="ts">
  import Match, { type MatchData } from './lib/Match.svelte';

  interface Props {
    matches: MatchData[];
    debugZone?: number;
  }

  const localOffset = new Date().getTimezoneOffset() / 60 * -1;
  let { matches, debugZone = localOffset }: Props = $props();

  // NOTE: "Hour" in names now indicates half-hour blocks, so 12:30 becomes "hour 25"
  function getMatchHour(date: Date, utc = false) {
    const hours = utc ? date.getUTCHours() : date.getHours();
    const mins = utc ? date.getUTCMinutes() : date.getMinutes();
    return hours * 2 + (mins ? 1 : 0);
  }

  // Calculate which local days and columns to show.
  // This needs to be reusable for the debug time zone switcher.
  let { days, cols, offsetMap } = $derived.by(() => {
    let days = [];
    let cols = 48; // Use half-hour blocks
    // Track which columns contain matches
    let usedCols = Array.from({ length: cols }, () => false);

    let curDay = { hasDoubles: false, matches: <MatchData[]>[] };
    for (let match of matches) {
      // Account for debug time zone offset
      match.date = new Date(match.baseDate);
      match.date.setHours(match.date.getHours() - (localOffset - debugZone));

      // Work out which local time days are used
      if (curDay.matches.length && match.date.getDate() !== curDay.matches[0].date.getDate()) {
        days.push(curDay);
        curDay = { hasDoubles: false, matches: [] };
      }
      // Clone the match object to ensure <Match> components re-render correctly
      curDay.matches.push({ ...match });
      if (match.isDoubleTime) {
        curDay.hasDoubles = true;
      }
      const matchHour = getMatchHour(match.date);

      // Each match takes up a 2-hour block; mark 4 half-hour columns as being used
      for (let i = 0; i < 4; i++) {
        usedCols[matchHour + i] = true;
      }
    }
    days.push(curDay);

    // Update column count in case extra columns were added at the end (e.g. matches after 10pm)
    cols = usedCols.length;
    const paddingStartEnd = 2;
    const paddingMiddle = 6;
    let i = 0;
    let offsetMap: Array<{ index: number; offset: number }> = [{ index: 0, offset: 0 }];
    let accOffset = 0;
    // Collapse runs of false values by tracking offset markers
    for (i = 0; i < usedCols.length; i++) {
      if (usedCols[i]) {
        continue;
      }
      let paddingValue = i === 0 ? paddingStartEnd : paddingMiddle;
      // Increment a counter until we hit a used column
      // used: [1, 0, 0, 0, 0, 1, 1]
      //           i           j
      let j = i;
      while (++j < usedCols.length && !usedCols[j]);
      if (j === usedCols.length) {
        paddingValue = paddingStartEnd;
      }
      let runLength = j - i;
      if (runLength > paddingValue) {
        let offset = runLength - paddingValue;
        cols -= offset;
        accOffset += offset;
        offsetMap.push({ index: i, offset: accOffset });
      }
      i += runLength;
    }

    console.log({ usedCols, cols, offsetMap });
    return { days, cols, offsetMap };
  });

  const dateFormatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  function displayDate(date: Date) {
    const parts = dateFormatter.formatToParts(date);
    for (const part of parts) {
      if (part.type === 'literal' && part.value === ', ') {
        part.value = ',<br>';
      }
    }
    return parts.map(p => p.value).join('');
  }

  function columnForMatch(match: MatchData) {
    let col = getMatchHour(match.date);
    let offset = offsetMap.findLast(({ index }) => col >= index);
    return col - (offset?.offset ?? 0);
  }
</script>

<div class="container" style="grid-template-columns: 5em repeat({cols}, 1fr);">
  {#each days as day}
    <div class="row">
      <span class="date" style="grid-row: span {day.hasDoubles ? 2 : 1}">
        {@html displayDate(day.matches[0].date)}
      </span>
      {#each day.matches as match}
        <Match {match} column={columnForMatch(match)} />
      {/each}
    </div>
  {/each}
</div>

<style>
  .container {
    border: 2px solid black;
    display: grid;
    column-gap: 1px;

    box-decoration-break: clone;
  }

  .row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    background-color: white;
    border: 1px solid black;

    break-inside: avoid;
  }

  .date {
    outline: 1px solid black;
    background-color: hsl(30, 100%, 95%);
    padding: 0.5em;
    display: flex;
    align-items: center;
  }
</style>
