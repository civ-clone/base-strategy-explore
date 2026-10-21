// Generic: explores with one unit, as a standing order (`UnitOrder`) from its player ("auto-explore",
//  civ-clone/web-renderer#198), the way the computer players explore: it heads for the nearest known tile beside the
//  unknown that it can reach (`exploreLand`, `exploreSea`), then takes the steps that would show it the most, and never
//  attacks or negotiates. The computer players' own units are left to `MissionAndMove`: `handles` is `false` for every
//  action, so registering this changes nothing they do.
import { Tile } from '@civ-clone/core-world/Tile';
import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import Action from '@civ-clone/core-unit/Action';
import { Mission } from '@civ-clone/base-strategy-ai/lib/Unit/mission';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import NoOrders from '@civ-clone/base-unit-action-no-orders/NoOrders';
import { OrderStrategy } from '@civ-clone/base-strategy-ai/Strategies/lib/OrderStrategy';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import UnitOrder from '@civ-clone/base-strategy-ai/PlayerActions/UnitOrder';
import enemyAdjacent from '@civ-clone/base-strategy-ai/lib/Unit/enemyAdjacent';
import { exploreMissions } from '../../lib/Unit/explore';
import followPath, {
  peacefulMoves,
} from '@civ-clone/base-strategy-ai/lib/Unit/followPath';
import { moveContext, scoreExploration } from '../../lib/Unit/scoreExploration';
import surveyTargets from '@civ-clone/base-strategy-ai/lib/Turn/surveyTargets';

// How many times in one order the unit looks for somewhere new to explore once it has nowhere worth stepping, as the
//  computer players' units do (`MissionAndMove`'s `onIdle`).
export const PATH_TRIES = 3;

// How many times in one order a path can be blocked before the unit is handed back.
export const BLOCKED_LIMIT = 2;

// How many paths and steps at most in one order, whatever happens.
const LOOP_LIMIT = 1e3;

export class Explore extends AIStrategy implements OrderStrategy {
  handles(action: PlayerAction): boolean {
    return false;
  }

  attempt(action: PlayerAction): boolean {
    return action instanceof UnitOrder && this.order(action);
  }

  order(action: UnitOrder): boolean {
    const dependencies = this.dependencies(),
      knowledge = this.knowledge(),
      player = action.player(),
      unit = action.value(),
      memory = this.memoryFor(player),
      turn = dependencies.turn.value();

    if (enemyAdjacent(dependencies, player, unit)) {
      return false;
    }

    // The player's own survey, made at most once a turn, so the player's explorers don't head for the same tiles.
    if (memory.surveyedTurn !== turn) {
      surveyTargets(dependencies, player, memory, knowledge);
    }

    if (!memory.lastUnitMoves.has(unit)) {
      memory.lastUnitMoves.set(unit, [unit.tile()]);
    }

    let tries = 0,
      blocked = 0;

    const pursue = (): boolean => {
      if (tries >= PATH_TRIES) {
        return false;
      }

      tries++;

      return exploreMissions.some((mission: Mission): boolean =>
        mission(dependencies, memory, unit)
      );
    };

    if (!memory.unitPathData.has(unit)) {
      pursue();
    }

    for (let loops = 0; loops < LOOP_LIMIT; loops++) {
      if (memory.unitPathData.has(unit)) {
        const result = followPath(
          dependencies,
          player,
          memory,
          knowledge,
          unit
        );

        if (result === 'threatened') {
          return false;
        }

        if (result === 'blocked' && ++blocked >= BLOCKED_LIMIT) {
          return false;
        }
      }

      if (!unit.active() || unit.moves().value() < 0.1) {
        return true;
      }

      if (enemyAdjacent(dependencies, player, unit)) {
        return false;
      }

      if (this.step(player, memory, unit)) {
        continue;
      }

      if (!pursue()) {
        return false;
      }
    }

    return true;
  }

  // The best step for exploring, by the exploring terms alone, among those the unit could come back from, if any is
  //  worth taking: takes it and returns `true`. With none, a unit that couldn't safely end its turn where it is (a
  //  Trireme away from the coast with its last move) takes the best step it could come back from instead, worth
  //  anything or not, rather than be handed back.
  private step(player: Player, memory: Memory, unit: Unit): boolean {
    const dependencies = this.dependencies(),
      knowledge = this.knowledge(),
      steps = unit
        .tile()
        .getNeighbours()
        .map((tile: Tile): [Tile, Action | undefined, number] => {
          const context = moveContext(
              dependencies,
              player,
              memory,
              knowledge,
              unit,
              tile
            ),
            [move] = peacefulMoves(context.actions);

          return [tile, move, move ? scoreExploration(context) : 0];
        })
        .filter(
          ([, move]): boolean =>
            move !== undefined &&
            knowledge.canReturnAfter(dependencies, player, unit, move)
        )
        // Stable, so equal scores keep the neighbours' order: no random draws on the player's behalf.
        .sort(([, , a], [, , b]): number => b - a),
      [best] = steps.filter(([, , score]): boolean => score > 0),
      [safest] = best === undefined && !this.canStay(player, unit) ? steps : [];

    if (!best && !safest) {
      return false;
    }

    const [tile, move] = best ?? safest;

    const lastMoves = memory.lastUnitMoves.get(unit) || [];

    lastMoves.push(tile);
    memory.lastUnitMoves.set(unit, lastMoves.slice(-50));

    unit.action(move!);

    return true;
  }

  // Whether `unit` could end its turn where it is, by the ruleset's judgement.
  private canStay(player: Player, unit: Unit): boolean {
    const dependencies = this.dependencies();

    return this.knowledge().canReturnAfter(
      dependencies,
      player,
      unit,
      new NoOrders(unit.tile(), unit.tile(), unit, dependencies.ruleRegistry)
    );
  }
}

export default Explore;
