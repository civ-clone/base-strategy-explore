import { ActionLookup } from '@civ-clone/base-strategy-ai/lib/actionLookup';
import Action from '@civ-clone/core-unit/Action';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import Memory from '@civ-clone/base-strategy-ai/lib/Memory';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export interface MoveContext {
  dependencies: Dependencies;
  player: Player;
  memory: Memory;
  knowledge: Knowledge;
  unit: Unit;
  tile: Tile;
  actions: Action[];
  lookup: ActionLookup;
}
export declare const moveContext: (
  dependencies: Dependencies,
  player: Player,
  memory: Memory,
  knowledge: Knowledge,
  unit: Unit,
  tile: Tile,
  actions?: Action[],
  lookup?: ActionLookup
) => MoveContext;
export declare const moveGate: ({
  dependencies,
  player,
  knowledge,
  unit,
  actions,
  lookup: { fortify, noOrders },
}: MoveContext) => number | null;
export declare const goodyHutTerm: ({
  dependencies,
  tile,
}: MoveContext) => number;
export declare const discoverableTilesTerm: ({
  dependencies,
  player,
  unit,
  tile,
}: MoveContext) => number;
export declare const headingForTargetTerm: ({
  memory,
  unit,
  tile,
}: MoveContext) => number;
export declare const revisitTerm: (
  { memory, unit, tile }: MoveContext,
  score: number
) => number;
export declare const scoreExploration: (context: MoveContext) => number;
export default scoreExploration;
