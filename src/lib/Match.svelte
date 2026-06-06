<script lang="ts">
  import { flagClasses } from './flagClasses';

  export interface MatchData {
    matchNum: number;
    round: string;
    date: Date;
    baseDate: Date;
    team1: string;
    team2: string;
    isDoubleTime: boolean;
    location: string;
  }

  interface Props {
    match: MatchData;
    column: number;
  }

  let { match, column }: Props = $props();

  // +1 to account for the first column being the date
  // +1 to account for CSS grid columns being 1-indexed
  let col = $derived(column + 2);
</script>

{#snippet team(name: string)}
  {#if flagClasses[name]}
    <span class="fi fi-{flagClasses[name]}"></span>
  {/if}
  {name}
{/snippet}

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
    {@render team(match.team1)}
  </span>
  <span class="team team2">
    {@render team(match.team2)}
  </span>
</div>

<style>
  .match {
    display: grid;
    grid-template-areas:
      "num time round"
      "num team1 team1"
      "num team2 team2";
    grid-template-columns: 0.8em 1fr 1fr;

    outline: 1px solid black;
    background-color: hsl(210, 100%, 95%);
    font-size: 1em;
    padding: 0.2em 0.4em 0.3em 0.5em;
  }
  /* 2023 WWC only: Colour based on host time zone */
  .match[data-location="NZL"] {
    background-color: hsl(0, 0%, 95%);
  }
  .match[data-location="AUE"] {
    background-color: hsl(120, 80%, 95%);
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
    left: 15%;
    transform: translate(-50%, -50%) rotate(-.25turn);
  }
  .time {
    grid-area: time;
  }
  .round {
    grid-area: round;
    text-align: right;
    font-weight: bold;
    padding-left: 0.2em;
  }
  .team {
    white-space: nowrap;
  }
  .team1 { grid-area: team1; }
  .team2 { grid-area: team2; }
</style>
