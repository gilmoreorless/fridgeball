<script>
  import '/node_modules/flag-icons/css/flag-icons.min.css';
  import rawData from './assets/schedule.tsv?raw';
  import Match from './lib/Match.svelte';

  const matchDateTimes = new Set();
  const matches = rawData
    .split('\n')
    .filter(line => line.length > 1)
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

  // Testing only!
  const localOffset = matches[0].date.getTimezoneOffset() / 60 * -1;
  let debugZone = localOffset;

  // NOTE: "Hour" in names now indicates half-hour blocks, so 12:30 becomes "hour 25"
  function getMatchHour(date) {
    return date.getHours() * 2 + (date.getMinutes() ? 1 : 0);
  }

  let days, cols, colOffset, colOffsetStart;
  // Calculate which local days and columns to show.
  // This needs to be reusable for the debug time zone switcher.
  $: {
    days = [];
    cols = 48; // Use half-hour blocks
    colOffset = 0;
    colOffsetStart = 0;
    let curDay = { hasDoubles: false, matches: [] };
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
      curDay.matches.push(match);
      if (match.isDoubleTime) {
        curDay.hasDoubles = true;
      }
      const matchHour = getMatchHour(match.date)
      if (matchHour > latestLocalHour) {
        latestLocalHour = matchHour;
      }
    }
    days.push(curDay);

    // This relies on the exact schedule, knowing the matches that are earliest/latest in the Qatar day
    const earliestMatchHour = getMatchHour(matches[24].date); // ARG-RSA
    const latestMatchHour = getMatchHour(matches[29].date); // PAN-JAM
    const matchesSpanCols = latestMatchHour + 4 - earliestMatchHour;
    const shouldShrinkMiddle = latestMatchHour < earliestMatchHour;
    if (shouldShrinkMiddle) {
      /**
       * THIS IS BROKEN!
       */
      // Some matches are on a different day from Qatar, leaving a huge gap between certain matches.
      // Work out where this large gap is and shrink it, while leaving 1-2 hour gaps alone.
      const shrinkStart = latestMatchHour + 8;
      const shrinkEnd = earliestMatchHour - 4;
      colOffset = shrinkEnd - shrinkStart;
      colOffsetStart = shrinkStart;
      cols -= colOffset;
      // Add an extra column to give space for matches starting at or after 10:30pm
      if (latestLocalHour >= 45) {
        cols += 2;
      }
      console.log({ cols, colOffset, colOffsetStart, shrinkStart, shrinkEnd, shouldShrinkMiddle });
    } else {
      /**
       * THIS DOESN'T WORK PROPERLY WHEN FIRST MATCH IS AT MIDNIGHT
       */
      // All matches are on the same day as Qatar; remove columns before/after blocks of matches
      // (but leave some padding in some cases?)
      const startPadding = earliestMatchHour >= 1 ? 1 : 0;
      colOffset = Math.max(earliestMatchHour - 2, 0) - startPadding;
      const endPadding = latestMatchHour < 44 ? 1 : 0;
      // const endOffset = 0; //(24 - latestMatchHour - 4 - endPadding);
      // cols = cols - colOffset - endOffset;
      cols = startPadding + matchesSpanCols + endPadding;
      console.log(shouldShrinkMiddle, {
        earliestMatchHour, latestMatchHour, latestLocalHour, matchesSpanCols,
        cols, colOffset, colOffsetStart, startPadding, endPadding,
      });
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  function displayDate(date) {
    const parts = dateFormatter.formatToParts(date);
    for (const part of parts) {
      if (part.type === 'literal' && part.value === ', ') {
        part.value = ',<br>';
      }
    }
    return parts.map(p => p.value).join('');
  }
</script>

<main>
  <div class="debug-controls">
    <label for="debug-time-zone"><strong>[DEBUG]</strong> Time zone offset (hours):</label>
    <input type="number" id="debug-time-zone" bind:value={debugZone} min="-14" max="14">
  </div>
  <div class="container" style="grid-template-columns: 5em repeat({cols}, 1fr);">
    {#each days as day}
      <div class="row">
        <span class="date" style="grid-row: span {day.hasDoubles ? 2 : 1}">
          <!-- {dateFormatter.format(day.matches[0].date)} -->
          {@html displayDate(day.matches[0].date)}
        </span>
        {#each day.matches as match}
          <!-- <Match match={match} latestMatchHour={shrinkMiddle ? latestMatchHour : 0} /> -->
          <Match match={match} colOffset={getMatchHour(match.date) >= colOffsetStart ? colOffset : 0} />
        {/each}
      </div>
    {/each}
  </div>
</main>

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
    border-right: 1px solid black;
    background-color: hsl(30, 100%, 95%);
    padding: 0.5em;
    display: flex;
    align-items: center;
  }

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
</style>
