"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Explore = exports.BLOCKED_LIMIT = exports.PATH_TRIES = void 0;
const AIStrategy_1 = require("@civ-clone/base-strategy-ai/Strategies/lib/AIStrategy");
const NoOrders_1 = require("@civ-clone/base-unit-action-no-orders/NoOrders");
const UnitOrder_1 = require("@civ-clone/base-strategy-ai/PlayerActions/UnitOrder");
const enemyAdjacent_1 = require("@civ-clone/base-strategy-ai/lib/Unit/enemyAdjacent");
const explore_1 = require("../../lib/Unit/explore");
const followPath_1 = require("@civ-clone/base-strategy-ai/lib/Unit/followPath");
const scoreExploration_1 = require("../../lib/Unit/scoreExploration");
const surveyTargets_1 = require("@civ-clone/base-strategy-ai/lib/Turn/surveyTargets");
// How many times in one order the unit looks for somewhere new to explore once it has nowhere worth stepping, as the
//  computer players' units do (`MissionAndMove`'s `onIdle`).
exports.PATH_TRIES = 3;
// How many times in one order a path can be blocked before the unit is handed back.
exports.BLOCKED_LIMIT = 2;
// How many paths and steps at most in one order, whatever happens.
const LOOP_LIMIT = 1e3;
class Explore extends AIStrategy_1.default {
    handles(action) {
        return false;
    }
    attempt(action) {
        return action instanceof UnitOrder_1.default && this.order(action);
    }
    order(action) {
        const dependencies = this.dependencies(), knowledge = this.knowledge(), player = action.player(), unit = action.value(), memory = this.memoryFor(player), turn = dependencies.turn.value();
        if ((0, enemyAdjacent_1.default)(dependencies, player, unit)) {
            return false;
        }
        // The player's own survey, made at most once a turn, so the player's explorers don't head for the same tiles.
        if (memory.surveyedTurn !== turn) {
            (0, surveyTargets_1.default)(dependencies, player, memory, knowledge);
        }
        if (!memory.lastUnitMoves.has(unit)) {
            memory.lastUnitMoves.set(unit, [unit.tile()]);
        }
        let tries = 0, blocked = 0;
        const pursue = () => {
            if (tries >= exports.PATH_TRIES) {
                return false;
            }
            tries++;
            return explore_1.exploreMissions.some((mission) => mission(dependencies, memory, unit));
        };
        if (!memory.unitPathData.has(unit)) {
            pursue();
        }
        for (let loops = 0; loops < LOOP_LIMIT; loops++) {
            if (memory.unitPathData.has(unit)) {
                const result = (0, followPath_1.default)(dependencies, player, memory, knowledge, unit);
                if (result === 'threatened') {
                    return false;
                }
                if (result === 'blocked' && ++blocked >= exports.BLOCKED_LIMIT) {
                    return false;
                }
            }
            if (!unit.active() || unit.moves().value() < 0.1) {
                return true;
            }
            if ((0, enemyAdjacent_1.default)(dependencies, player, unit)) {
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
    step(player, memory, unit) {
        const dependencies = this.dependencies(), knowledge = this.knowledge(), steps = unit
            .tile()
            .getNeighbours()
            .map((tile) => {
            const context = (0, scoreExploration_1.moveContext)(dependencies, player, memory, knowledge, unit, tile), [move] = (0, followPath_1.peacefulMoves)(context.actions);
            return [tile, move, move ? (0, scoreExploration_1.scoreExploration)(context) : 0];
        })
            .filter(([, move]) => move !== undefined &&
            knowledge.canReturnAfter(dependencies, player, unit, move))
            // Stable, so equal scores keep the neighbours' order: no random draws on the player's behalf.
            .sort(([, , a], [, , b]) => b - a), [best] = steps.filter(([, , score]) => score > 0), [safest] = best === undefined && !this.canStay(player, unit) ? steps : [];
        if (!best && !safest) {
            return false;
        }
        const [tile, move] = best !== null && best !== void 0 ? best : safest;
        const lastMoves = memory.lastUnitMoves.get(unit) || [];
        lastMoves.push(tile);
        memory.lastUnitMoves.set(unit, lastMoves.slice(-50));
        unit.action(move);
        return true;
    }
    // Whether `unit` could end its turn where it is, by the ruleset's judgement.
    canStay(player, unit) {
        const dependencies = this.dependencies();
        return this.knowledge().canReturnAfter(dependencies, player, unit, new NoOrders_1.default(unit.tile(), unit.tile(), unit, dependencies.ruleRegistry));
    }
}
exports.Explore = Explore;
exports.default = Explore;
//# sourceMappingURL=Explore.js.map