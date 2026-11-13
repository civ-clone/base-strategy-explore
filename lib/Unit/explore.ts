// Generic: the exploring missions, setting a unit off for the nearest known tile beside the unknown that it can reach:
//  by land for a land unit, by sea for a ship. The tiles come from the player's survey (`surveyTargets`).
import {
  Mission,
  nearest,
  pursue,
} from '@civ-clone/base-strategy-ai/lib/Unit/mission';
import Land from '@civ-clone/base-unit-type-land/Land';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
import { isA } from '@civ-clone/core-unit/traits';

export const exploreLand: Mission = (dependencies, memory, unit) => {
  const { landTilesToExplore } = memory.targets;

  if (!(isA(unit, Land) && landTilesToExplore.length > 0)) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    landTilesToExplore,
    landTilesToExplore.sort(nearest(unit))
  );
};

export const exploreSea: Mission = (dependencies, memory, unit) => {
  const { seaTilesToExplore } = memory.targets;

  if (!(isA(unit, Naval) && seaTilesToExplore.length > 0)) {
    return false;
  }

  return pursue(
    dependencies,
    memory,
    unit,
    seaTilesToExplore,
    seaTilesToExplore.sort(nearest(unit))
  );
};

// In the order the computer players try them.
export const exploreMissions: Mission[] = [exploreLand, exploreSea];

export default exploreMissions;
