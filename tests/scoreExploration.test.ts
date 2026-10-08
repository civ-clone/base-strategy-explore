import {
  discoverableTilesTerm,
  goodyHutTerm,
  moveContext,
  moveGate,
  revisitTerm,
  scoreExploration,
} from '../lib/Unit/scoreExploration';
import { exploreLand, exploreSea } from '../lib/Unit/explore';
import testGame, { knowledge } from './lib/testGame';
import Tile from '@civ-clone/core-world/Tile';
import { Warrior } from '@civ-clone/civ1-unit/Units';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { expect } from 'chai';

const at = (tile: Tile): string => `${tile.x()},${tile.y()}`;

describe('scoreExploration', (): void => {
  it('should count the unknown tiles a step would show, four times over for a tile not visited lately', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies, world } = await testGame(
        '25G',
        5,
        5
      ),
      player = addPlayer((tile: Tile): boolean => tile.x() <= 1),
      unit = addUnit(Warrior, player, 0, 2),
      memory = createMemory(),
      context = moveContext(
        dependencies,
        player,
        memory,
        knowledge,
        unit,
        world.get(1, 2)
      );

    expect(moveGate(context)).to.equal(null);
    expect(goodyHutTerm(context)).to.equal(0);
    expect(discoverableTilesTerm(context)).to.equal(9);
    expect(revisitTerm(context, 9)).to.equal(36);
    expect(scoreExploration(context)).to.equal(36);

    memory.lastUnitMoves.set(unit, [world.get(1, 2)]);

    expect(scoreExploration(context)).to.equal(9);
  });

  it('should rule out a step the unit could not come back from', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies, world } = await testGame(
        '25G',
        5,
        5
      ),
      player = addPlayer(),
      unit = addUnit(Warrior, player, 0, 2);

    expect(
      scoreExploration(
        moveContext(
          dependencies,
          player,
          createMemory(),
          { ...knowledge, canReturnAfter: (): boolean => false },
          unit,
          world.get(1, 2)
        )
      )
    ).to.equal(-1);
  });

  it('should send a land unit to the nearest land beside the unknown, and not to sea', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies, world } = await testGame(
        '10G',
        1,
        10
      ),
      player = addPlayer(),
      unit = addUnit(Warrior, player, 0, 0),
      memory = createMemory();

    // The world wraps: 6,0 is 4 tiles away, and 2,0 is 2.
    memory.targets.landTilesToExplore.push(world.get(6, 0), world.get(2, 0));
    memory.targets.seaTilesToExplore.push(world.get(1, 0));

    expect(exploreSea(dependencies, memory, unit)).false;
    expect(exploreLand(dependencies, memory, unit)).true;
    expect(at(memory.unitPathData.get(unit)!.end())).to.equal('2,0');
    expect(memory.targets.landTilesToExplore.map(at)).to.eql(['6,0']);
  });
});
