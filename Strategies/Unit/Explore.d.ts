import AIStrategy from '@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy';
import { OrderStrategy } from '@civ-clone/base-strategy-ai/Strategies/lib/OrderStrategy';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import UnitOrder from '@civ-clone/base-strategy-ai/PlayerActions/UnitOrder';
export declare const PATH_TRIES = 3;
export declare const BLOCKED_LIMIT = 2;
export declare class Explore extends AIStrategy implements OrderStrategy {
  handles(action: PlayerAction): boolean;
  attempt(action: PlayerAction): boolean;
  order(action: UnitOrder): boolean;
  private step;
  private canStay;
}
export default Explore;
