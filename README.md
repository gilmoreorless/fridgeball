# Fridgeball

A match schedule for a major football tournament, designed to be printed out and stuck on a fridge.
Some things are still better in low-tech mode.

This was quickly initially hacked together on a weekend in 2022, and has been tweaked as required for subsequent tournaments.
It's not intended to be tracker for match results, I just wanted something that fulfils these criteria:

1. Clearly shows exactly which matches are when, in order (not clumped by venue or group).
2. Shows matches in a grid **in my local time zone**.
2. Doesn't waste printer ink with a bunch of frivolous graphics.

Every search for a match schedule online failed at least one of those criteria, so I built my own.

## :warning: NOTE: Display problems

1. This page only works properly in a browser that supports CSS `subgrid`.
2. When viewing the page on a large monitor, the table might look weird. The page scales to browser width, but it's optimised for printing on A4 paper, and should work fine with US Letter size as well.
3. Different browsers interpret print rules in different ways, so results may vary.

Like I said, I quickly hacked it together for myself. If anyone else finds it useful, that's an added bonus.
It will always display in the time zone of the viewer.

## Local testing

```
pnpm install
pnpm dev
```
