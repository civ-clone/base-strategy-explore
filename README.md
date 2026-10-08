# base-strategy-explore

Exploring, as the computer players do it and as a standing order for one of a player's units ("auto-explore",
civ-clone/web-renderer#198). Built on [`base-strategy-ai`](https://github.com/civ-clone/base-strategy-ai).

- `lib/Unit/explore`: the `exploreLand` and `exploreSea` missions, sending a unit to the nearest known tile beside the
  unknown that it can reach.
- `lib/Unit/scoreExploration`: the exploring terms of how good a step looks: `moveGate`, `goodyHutTerm`,
  `discoverableTilesTerm`, `headingForTargetTerm` and `revisitTerm`, over a `moveContext` that asks for the unit's
  actions onto the tile once. `scoreExploration` adds them alone; `simple-ai-client`'s move score adds them, in the
  same order, around its own terms for fighting, founding cities and ships.
- `Strategies/Unit/Explore`: an `OrderStrategy`. `handles` is `false` for every action, so registering it changes
  nothing a computer player does. `order(new UnitOrder(player, unit))` surveys for the player once a turn, sets the
  unit off for somewhere to explore, follows the path peacefully (`followPath`) and then takes the steps that show it
  the most, looking for somewhere new up to `PATH_TRIES` times. It returns `false` to hand the unit back: nothing
  left to explore, another player's unit near, or its path blocked twice.
