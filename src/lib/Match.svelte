<script>
  import { run } from 'svelte/legacy';

  import { flagClasses } from './flagClasses';

  /**
   * @typedef {Object} Props
   * @property {any} [match]
   * @property {number} [colOffset]
   */

  /** @type {Props} */
  let { match = {}, colOffset = 0 } = $props();

  let col = $state(0);
  run(() => {
    const hour = match.date?.getHours() || 0;
    col = hour * 2 - colOffset;
    if (match.date?.getMinutes()) {
      col++;
    }
    // +1 to account for the first column being the date
    // +1 to account for grid columns being 1-indexed
    col += 2;
  });
</script>

<div class="match" data-location={match.location} style="
  grid-column: {col} / {col + 4};
  grid-row: {match.isDoubleTime ? 2 : 1};
">
  <span class="num"><span>Match {match.matchNum}</span></span>
  <time class="time" datetime="{match.date.toISOString()}">
    {match.date.toLocaleString('en', { hour: 'numeric', hour12: false, minute: '2-digit' })}
  </time>
  <span class="round">{match.round}</span>
  <span class="team team1">
    {#if flagClasses[match.team1]}
      <span class="fi fi-{flagClasses[match.team1]}"></span>
    {/if}
    {match.team1}
  </span>
  <span class="team team2">
    {#if flagClasses[match.team2]}
      <span class="fi fi-{flagClasses[match.team2]}"></span>
    {/if}
    {match.team2}
  </span>
</div>

<style>
  .match {
    display: grid;
    grid-template-areas:
      "num time round"
      "num team1 team1"
      "num team2 team2";
    grid-template-columns: 1em 1fr 1fr;

    outline: 1px solid black;
    background-color: hsl(120, 100%, 95%);
    font-size: 1em;
    padding: 0.2em 0.5em 0.3em;
  }
  .match[data-location="NZL"] {
    background-color: hsl(0, 0%, 95%);
  }
  .match[data-location="AUW"] {
    background-color: hsl(0, 80%, 95%);
  }
  .match[data-location="AUC"] {
    background-color: hsl(210, 80%, 95%);
  }
  .num {
    grid-area: num;
    white-space: nowrap;
    position: relative;
  }
  .num > span {
    font-size: 0.8rem;
    display: block;
    position: absolute;
    top: 50%;
    left: 20%;
    transform: translate(-50%, -50%) rotate(-.25turn);
  }
  .time {
    grid-area: time;
  }
  .round {
    grid-area: round;
    text-align: right;
    padding-left: 0.5em;
  }
  .team {
    white-space: nowrap;
  }
  .team1 { grid-area: team1; }
  .team2 { grid-area: team2; }
</style>
