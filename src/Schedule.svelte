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
  let { days, cols, colOffset, colOffsetStart } = $derived.by(() => {
    let days = [];
    let cols = 48; // Use half-hour blocks
    let colOffset = 0;
    let colOffsetStart = 0;
    let curDay = { hasDoubles: false, matches: <MatchData[]>[] };
    let earliestMatch: [number, Date] = [cols, null];
    let latestMatch: [number, Date] = [0, null];
    let latestLocalHour = 0;
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
      const matchHour = getMatchHour(match.date)
      if (matchHour > latestLocalHour) {
        latestLocalHour = matchHour;
      }
      const utcMatchHour = getMatchHour(match.date, true);
      if (utcMatchHour > latestMatch[0]) {
        latestMatch = [utcMatchHour, match.date];
      }
      if (utcMatchHour < earliestMatch[0]) {
        earliestMatch = [utcMatchHour, match.date];
      }
    }
    days.push(curDay);

    // Try to work out the earliest/latest start times to aid in removing unnecessary columns
    // NOTE: This only works for the user's time zone, but breaks when using the debug UI
    // TODO: Convert to Temporal?
    const earliestMatchHour = getMatchHour(earliestMatch[1]);
    const latestMatchHour = getMatchHour(latestMatch[1]);

    const matchesSpanCols = latestMatchHour + 4 - earliestMatchHour;
    const shouldShrinkMiddle = latestMatchHour < earliestMatchHour;
    if (shouldShrinkMiddle) {
      // Some matches are on a different day from Qatar, leaving a huge gap between certain matches.
      // Work out where this large gap is and shrink it, while leaving 1-2 hour gaps alone.
      const shrinkStart = latestMatchHour + 6;
      const shrinkEnd = earliestMatchHour - 4;
      colOffset = shrinkEnd - shrinkStart;
      colOffsetStart = shrinkStart;
      cols -= colOffset;
      // Add an extra column to give space for matches starting at or after 10:30pm
      if (latestLocalHour >= 45) {
        cols += 2;
      }
      // ...and one more for the special case of a match starting at 11:30pm
      if (latestLocalHour == 47) {
        cols += 1;
      }
      console.log(shouldShrinkMiddle, { cols, colOffset, colOffsetStart, shrinkStart, shrinkEnd });
    } else {
      // All matches are on the same day as the host; remove columns before/after blocks of matches
      // (but leave some padding in some cases?)
      const startPadding = earliestMatchHour >= 1 ? 1 : 0;
      colOffset = Math.max(earliestMatchHour - 2, 0) + startPadding;
      const endPadding = latestMatchHour < 44 ? 1 : 0;
      cols = startPadding + matchesSpanCols + endPadding;
      console.log(shouldShrinkMiddle, {
        earliestMatchHour, latestMatchHour, latestLocalHour, matchesSpanCols,
        cols, colOffset, colOffsetStart, startPadding, endPadding,
      });
    }
    return { days, cols, colOffset, colOffsetStart };
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
</script>

<div class="container" style="grid-template-columns: 5em repeat({cols}, 1fr);">
  {#each days as day}
    <div class="row">
      <span class="date" style="grid-row: span {day.hasDoubles ? 2 : 1}">
        {@html displayDate(day.matches[0].date)}
      </span>
      {#each day.matches as match}
        <Match {match} colOffset={getMatchHour(match.date) >= colOffsetStart ? colOffset : 0} />
      {/each}
    </div>
  {/each}
</div>

<style>
  .container {
    border: 2px solid black;
    display: grid;
    column-gap: 1px;
  }
  .row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    background-color: white;
    border: 1px solid black;
  }
  .date {
    outline: 1px solid black;
    background-color: hsl(30, 100%, 95%);
    padding: 0.5em;
    display: flex;
    align-items: center;
  }
</style>
