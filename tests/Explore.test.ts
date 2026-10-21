import { Horseman, Trireme, Warrior } from '@civ-clone/civ1-unit/Units';
import Action from '@civ-clone/core-unit/Action';
import Knowledge from '@civ-clone/base-strategy-ai/lib/Knowledge';
import testGame, { knowledge } from './lib/testGame';
import Explore from '../Strategies/Unit/Explore';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Tile from '@civ-clone/core-world/Tile';
import UnitOrder from '@civ-clone/base-strategy-ai/PlayerActions/UnitOrder';
import { createMemory } from '@civ-clone/base-strategy-ai/lib/Memory';
import { expect } from 'chai';

const at = (tile: Tile): string => `${tile.x()},${tile.y()}`;
import { instance as memoryRegistryInstance } from '@civ-clone/base-strategy-ai/lib/MemoryRegistry';

describe('Explore', (): void => {
  it('should handle none of the computer players’ actions', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies } = await testGame('9G', 3, 3),
      player = addPlayer(),
      unit = addUnit(Warrior, player, 1, 1),
      explore = new Explore(dependencies, knowledge);

    expect(explore.handles(new PlayerAction(player, unit))).false;
    expect(explore.handles(new UnitOrder(player, unit))).false;
    expect(explore.attempt(new PlayerAction(player, unit))).false;
  });

  it('should head for the unknown and look around', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies } = await testGame('50G', 5, 10),
      player = addPlayer((tile: Tile): boolean => tile.x() <= 1),
      unit = addUnit(Horseman, player, 0, 2),
      explore = new Explore(dependencies, knowledge);

    expect(explore.order(new UnitOrder(player, unit))).true;
    expect(at(unit.tile())).to.not.equal('0,2');
    expect(unit.moves().value()).to.equal(0);
    // It surveyed for the player.
    expect(memoryRegistryInstance.memoryFor(player).surveyedTurn).to.equal(
      dependencies.turn.value()
    );
  });

  it('should hand the unit back when there is nothing left to explore', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies, world } = await testGame(
        '9G',
        3,
        3
      ),
      player = addPlayer(),
      unit = addUnit(Warrior, player, 1, 1);

    expect(
      new Explore(dependencies, knowledge).order(new UnitOrder(player, unit))
    ).false;
    expect(at(unit.tile())).to.equal('1,1');
  });

  it('should hand the unit back, without moving it, when another player’s unit is near', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies, world } = await testGame(
        '25G',
        5,
        5
      ),
      player = addPlayer((tile: Tile): boolean => tile.x() <= 1),
      other = addPlayer(),
      unit = addUnit(Horseman, player, 0, 2),
      enemy = addUnit(Warrior, other, 1, 2);

    expect(
      new Explore(dependencies, knowledge).order(new UnitOrder(player, unit))
    ).false;
    expect(at(unit.tile())).to.equal('0,2');
    expect(enemy.destroyed()).false;
  });

  it('should keep the rest of its path for its next turn', async (): Promise<void> => {
    const { addPlayer, addUnit, dependencies } = await testGame('40G', 1, 40),
      player = addPlayer((tile: Tile): boolean => tile.x() <= 10),
      unit = addUnit(Warrior, player, 0, 0),
      memory = memoryRegistryInstance.memoryFor(player);

    expect(
      new Explore(dependencies, knowledge).order(new UnitOrder(player, unit))
    ).true;
    expect(unit.tile().x()).to.equal(1);
    expect(memory.unitPathData.get(unit)?.end().x()).to.equal(10);
    expect(createMemory().unitPathData.size).to.equal(0);
  });

  it('should bring a ship that must end its turn by the coast back to it with its last move, rather than hand it back', async (): Promise<void> => {
    // Land down the left, ocean beyond: only the column next to the land is coast.
    const { addPlayer, addUnit, dependencies } = await testGame(
        '1G4O1G4O1G4O',
        3,
        5
      ),
      player = addPlayer((tile: Tile): boolean => tile.x() <= 2),
      unit = addUnit(Trireme, player, 2, 1),
      // Like Civ1's Trireme: it ends a turn on the coast, or has a move to spare.
      coastal: Knowledge = {
        ...knowledge,
        canReturnAfter: (dependencies, player, unit, action: Action) =>
          action.to().isCoast() || unit.moves().value() > 1,
      };

    unit.moves().set(1);

    expect(
      new Explore(dependencies, coastal).order(new UnitOrder(player, unit))
    ).true;
    expect(unit.tile().x()).to.equal(1);
  });
});
