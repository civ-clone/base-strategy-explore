"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreExploration = exports.revisitTerm = exports.headingForTargetTerm = exports.discoverableTilesTerm = exports.goodyHutTerm = exports.moveGate = exports.moveContext = void 0;
// Generic: the exploring terms of how good a step onto `tile` looks for `unit`: the ones that don't depend on fighting
//  anyone. `simple-ai-client`'s move score adds them, in this order, around its own terms for attacking, capturing,
//  founding cities and ships; `Explore` adds only these (`scoreExploration`).
const actionLookup_1 = require("@civ-clone/base-strategy-ai/lib/actionLookup");
const Fortifiable_1 = require("@civ-clone/base-unit-type-fortifiable/Fortifiable");
const Tile_1 = require("@civ-clone/core-world/Tile");
const reachable_1 = require("@civ-clone/base-strategy-ai/lib/Unit/reachable");
const moveContext = (dependencies, player, memory, knowledge, unit, tile, actions = unit.actions(tile), lookup = (0, actionLookup_1.lookupActions)(actions)) => ({
    dependencies,
    player,
    memory,
    knowledge,
    unit,
    tile,
    actions,
    lookup,
});
exports.moveContext = moveContext;
// -1, ruling the step out, if the unit couldn't get back to safety after it, or there's nothing to do there but stand
//  down. Otherwise `null`, and the step is scored.
const moveGate = ({ dependencies, player, knowledge, unit, actions, lookup: { fortify, noOrders }, }) => {
    const [firstAction] = actions;
    if (firstAction &&
        !knowledge.canReturnAfter(dependencies, player, unit, firstAction)) {
        return -1;
    }
    if (!actions.length ||
        (actions.length === 1 && noOrders) ||
        (unit instanceof Fortifiable_1.default && actions.length === 2 && fortify && noOrders)) {
        return -1;
    }
    return null;
};
exports.moveGate = moveGate;
// A goody hut on the tile.
const goodyHutTerm = ({ dependencies, tile }) => dependencies.goodyHutRegistry.getByTile(tile) !== null ? 60 : 0;
exports.goodyHutTerm = goodyHutTerm;
// The unknown tiles around `tile` the unit could go on to: the sea a land unit can see across would count for ever,
//  as a coast it could never reach (civ-clone/web-renderer#230).
const discoverableTilesTerm = ({ dependencies, player, unit, tile, }) => {
    const playerWorld = dependencies.playerWorldRegistry.getByPlayer(player), canEnter = (0, reachable_1.terrainFor)(unit);
    const discoverableTiles = tile
        .getNeighbours()
        .filter((neighbouringTile) => !playerWorld.includes(neighbouringTile) &&
        (canEnter === null || canEnter(neighbouringTile))).length;
    return discoverableTiles > 0 ? discoverableTiles * 3 : 0;
};
exports.discoverableTilesTerm = discoverableTilesTerm;
// A step towards the unit's target, if it has one.
const headingForTargetTerm = ({ memory, unit, tile, }) => {
    const target = memory.unitTargetData.get(unit);
    return target instanceof Tile_1.default &&
        tile.distanceFrom(target) < unit.tile().distanceFrom(target)
        ? 14
        : 0;
};
exports.headingForTargetTerm = headingForTargetTerm;
// The score so far, four times over for a tile the unit hasn't been to lately.
const revisitTerm = ({ memory, unit, tile }, score) => {
    const lastMoves = memory.lastUnitMoves.get(unit) || [];
    return lastMoves.includes(tile) ? score : score * 4;
};
exports.revisitTerm = revisitTerm;
// How good the step looks for exploring alone. Below 0 rules it out.
const scoreExploration = (context) => {
    const gate = (0, exports.moveGate)(context);
    if (gate !== null) {
        return gate;
    }
    let score = 0;
    score += (0, exports.goodyHutTerm)(context);
    score += (0, exports.discoverableTilesTerm)(context);
    score += (0, exports.headingForTargetTerm)(context);
    return (0, exports.revisitTerm)(context, score);
};
exports.scoreExploration = scoreExploration;
exports.default = exports.scoreExploration;
//# sourceMappingURL=scoreExploration.js.map