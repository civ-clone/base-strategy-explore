// The unit-class check `moveGate` made before it asked the unit's traits, kept as a literal fixture: it must give the
//  same answer for every Civ1 unit type (civ-clone/web-renderer#1008).
import * as Units from '@civ-clone/civ1-unit/Units';
import { moveContext, moveGate } from '../lib/Unit/scoreExploration';
import testGame, { knowledge } from './lib/testGame';
import Action from '@civ-clone/core-unit/Action';
import Fortifiable from '@civ-clone/base-unit-type-fortifiable/Fortifiable';
import Unit from '@civ-clone/core-unit/Unit';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { expect } from 'chai';

describe('moveGate and unit traits', (): void => {
  it('should rule out a step with nothing to do but fortify or stand down for the same Civ1 units as `Fortifiable` did', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies, world } = await testGame(
        '9G',
        3,
        3
      ),
      player = addPlayer(),
      UnitTypes = Object.values(Units) as (new (...args: any[]) => Unit)[],
      // Only the shape `moveGate` reads: two actions, one of them fortifying and the other "no orders".
      fortify = {} as Action,
      noOrders = {} as Action,
      ruledOut = UnitTypes.filter((UnitType): boolean => {
        const unit = addUnit(UnitType, player, 1, 1),
          gate = moveGate(
            moveContext(
              dependencies,
              player,
              createMemory(),
              knowledge,
              unit,
              world.get(1, 1),
              [fortify, noOrders],
              { fortify, noOrders } as any
            )
          );

        expect(gate, UnitType.name).to.equal(
          unit instanceof Fortifiable ? -1 : null
        );

        return gate === -1;
      });

    expect(UnitTypes.length).to.equal(28);
    // Neither always nor never: the 13 military land units, the Diplomat and the Caravan.
    expect(ruledOut.length).to.equal(15);
  });
});
