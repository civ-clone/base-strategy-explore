// Generic: the exploring terms of how good a step onto `tile` looks for `unit`: the ones that don't depend on fighting
//  anyone. `simple-ai-client`'s move score adds them, in this order, around its own terms for attacking, capturing,
//  founding cities and ships; `Explore` adds only these (`scoreExploration`).
import {
  ActionLookup,
  lookupActions,
} from '@civ-clone/base-strategy-ai/lib/actionLookup';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Fortifiable from '@civ-clone/base-unit-type-fortifiable/Fortifiable';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { terrainFor } from '@civ-clone/base-strategy-ai/lib/Unit/reachable';

// Everything a term reads, with the unit's actions onto `tile` asked for once: `unit.actions` creates `Action`s,
//  whose ids are part of the game's state.
export interface MoveContext {
  dependencies: Dependencies;
  player: Player;
  memory: Memory;
  knowledge: Knowledge;
  unit: Unit;
  tile: Tile;
  // `unit.actions(tile)`.
  actions: Action[];
  // `actions`, by name.
  lookup: ActionLookup;
}

export const moveContext = (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile,
  actions: Action[] = unit.actions(tile),
  lookup: ActionLookup = lookupActions(actions)
): MoveContext => ({
  dependencies,
  player,
  memory,
  knowledge,
  unit,
  tile,
  actions,
  lookup,
});

// -1, ruling the step out, if the unit couldn't get back to safety after it, or there's nothing to do there but stand
//  down. Otherwise `null`, and the step is scored.
export const moveGate = ({
  dependencies,
  player,
  knowledge,
  unit,
  actions,
  lookup: { fortify, noOrders },
}: MoveContext): number | null => {
  const [firstAction] = actions;

  if (
    firstAction &&
    !knowledge.canReturnAfter(dependencies, player, unit, firstAction)
  ) {
    return -1;
  }

  if (
    !actions.length ||
    (actions.length === 1 && noOrders) ||
    (unit instanceof Fortifiable && actions.length === 2 && fortify && noOrders)
  ) {
    return -1;
  }

  return null;
};

// A goody hut on the tile.
export const goodyHutTerm = ({ dependencies, tile }: MoveContext): number =>
  dependencies.goodyHutRegistry.getByTile(tile) !== null ? 60 : 0;

// The unknown tiles around `tile` the unit could go on to: the sea a land unit can see across would count for ever,
//  as a coast it could never reach (civ-clone/web-renderer#230).
export const discoverableTilesTerm = ({
  dependencies,
  player,
  unit,
  tile,
}: MoveContext): number => {
  const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player),
    canEnter = terrainFor(unit);

  const discoverableTiles = tile
    .getNeighbours()
    .filter(
      (neighbouringTile: Tile): boolean =>
        !playerWorld.includes(neighbouringTile) &&
        (canEnter === null || canEnter(neighbouringTile))
    ).length;

  return discoverableTiles > 0 ? discoverableTiles * 3 : 0;
};

// A step towards the unit's target, if it has one.
export const headingForTargetTerm = ({
  memory,
  unit,
  tile,
}: MoveContext): number => {
  const target = memory.unitTargetData.get(unit);

  return target instanceof Tile &&
    tile.distanceFrom(target) < unit.tile().distanceFrom(target)
    ? 14
    : 0;
};

// The score so far, four times over for a tile the unit hasn't been to lately.
export const revisitTerm = (
  { memory, unit, tile }: MoveContext,
  score: number
): number => {
  const lastMoves = memory.lastUnitMoves.get(unit) || [];

  return lastMoves.includes(tile) ? score : score * 4;
};

// How good the step looks for exploring alone. Below 0 rules it out.
export const scoreExploration = (context: MoveContext): number => {
  const gate = moveGate(context);

  if (gate !== null) {
    return gate;
  }

  let score = 0;

  score += goodyHutTerm(context);
  score += discoverableTilesTerm(context);
  score += headingForTargetTerm(context);

  return revisitTerm(context, score);
};

export default scoreExploration;
