"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreMissions = exports.exploreSea = exports.exploreLand = void 0;
// Generic: the exploring missions, setting a unit off for the nearest known tile beside the unknown that it can reach:
//  by land for a land unit, by sea for a ship. The tiles come from the player's survey (`surveyTargets`).
const mission_1 = require("@civ-clone/base-strategy-ai/lib/Unit/mission");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const Naval_1 = require("@civ-clone/base-unit-type-naval/Naval");
const exploreLand = (dependencies, memory, unit) => {
    const { landTilesToExplore } = memory.targets;
    if (!(unit instanceof Land_1.default && landTilesToExplore.length > 0)) {
        return false;
    }
    return (0, mission_1.pursue)(dependencies, memory, unit, landTilesToExplore, landTilesToExplore.sort((0, mission_1.nearest)(unit)));
};
exports.exploreLand = exploreLand;
const exploreSea = (dependencies, memory, unit) => {
    const { seaTilesToExplore } = memory.targets;
    if (!(unit instanceof Naval_1.default && seaTilesToExplore.length > 0)) {
        return false;
    }
    return (0, mission_1.pursue)(dependencies, memory, unit, seaTilesToExplore, seaTilesToExplore.sort((0, mission_1.nearest)(unit)));
};
exports.exploreSea = exploreSea;
// In the order the computer players try them.
exports.exploreMissions = [exports.exploreLand, exports.exploreSea];
exports.default = exports.exploreMissions;
//# sourceMappingURL=explore.js.map