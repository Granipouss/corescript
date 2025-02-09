import { randomInt } from '../rpg_core/extension';
import type { RPGMoveCommand } from '../rpg_data/move-command';
import type { RPGMoveRoute } from '../rpg_data/move-route';
import { AudioManager } from '../rpg_managers/AudioManager';
import { Game_CharacterBase } from './Game_CharacterBase';

/**
 * The superclass of Game_Player, Game_Follower, GameVehicle, and Game_Event.
 */
export abstract class Game_Character extends Game_CharacterBase {
    static ROUTE_END = 0;
    static ROUTE_MOVE_DOWN = 1;
    static ROUTE_MOVE_LEFT = 2;
    static ROUTE_MOVE_RIGHT = 3;
    static ROUTE_MOVE_UP = 4;
    static ROUTE_MOVE_LOWER_L = 5;
    static ROUTE_MOVE_LOWER_R = 6;
    static ROUTE_MOVE_UPPER_L = 7;
    static ROUTE_MOVE_UPPER_R = 8;
    static ROUTE_MOVE_RANDOM = 9;
    static ROUTE_MOVE_TOWARD = 10;
    static ROUTE_MOVE_AWAY = 11;
    static ROUTE_MOVE_FORWARD = 12;
    static ROUTE_MOVE_BACKWARD = 13;
    static ROUTE_JUMP = 14;
    static ROUTE_WAIT = 15;
    static ROUTE_TURN_DOWN = 16;
    static ROUTE_TURN_LEFT = 17;
    static ROUTE_TURN_RIGHT = 18;
    static ROUTE_TURN_UP = 19;
    static ROUTE_TURN_90D_R = 20;
    static ROUTE_TURN_90D_L = 21;
    static ROUTE_TURN_180D = 22;
    static ROUTE_TURN_90D_R_L = 23;
    static ROUTE_TURN_RANDOM = 24;
    static ROUTE_TURN_TOWARD = 25;
    static ROUTE_TURN_AWAY = 26;
    static ROUTE_SWITCH_ON = 27;
    static ROUTE_SWITCH_OFF = 28;
    static ROUTE_CHANGE_SPEED = 29;
    static ROUTE_CHANGE_FREQ = 30;
    static ROUTE_WALK_ANIME_ON = 31;
    static ROUTE_WALK_ANIME_OFF = 32;
    static ROUTE_STEP_ANIME_ON = 33;
    static ROUTE_STEP_ANIME_OFF = 34;
    static ROUTE_DIR_FIX_ON = 35;
    static ROUTE_DIR_FIX_OFF = 36;
    static ROUTE_THROUGH_ON = 37;
    static ROUTE_THROUGH_OFF = 38;
    static ROUTE_TRANSPARENT_ON = 39;
    static ROUTE_TRANSPARENT_OFF = 40;
    static ROUTE_CHANGE_IMAGE = 41;
    static ROUTE_CHANGE_OPACITY = 42;
    static ROUTE_CHANGE_BLEND_MODE = 43;
    static ROUTE_PLAY_SE = 44;
    static ROUTE_SCRIPT = 45;

    protected _moveRouteForcing: boolean;
    protected _moveRoute: RPGMoveRoute;
    protected _moveRouteIndex: number;
    protected _originalMoveRoute: RPGMoveRoute;
    protected _originalMoveRouteIndex: number;
    protected _waitCount: number;
    protected _callerEventInfo: Record<string, unknown>;
    protected _mapId: number;
    protected _eventId: number;
    protected _pageIndex: number;

    initMembers(): void {
        super.initMembers();
        this._moveRouteForcing = false;
        this._moveRoute = null;
        this._moveRouteIndex = 0;
        this._originalMoveRoute = null;
        this._originalMoveRouteIndex = 0;
        this._waitCount = 0;
        this._callerEventInfo = null;
    }

    memorizeMoveRoute(): void {
        this._originalMoveRoute = this._moveRoute;
        this._originalMoveRouteIndex = this._moveRouteIndex;
    }

    restoreMoveRoute(): void {
        this._moveRoute = this._originalMoveRoute;
        this._moveRouteIndex = this._originalMoveRouteIndex;
        this._originalMoveRoute = null;
        this._callerEventInfo = null;
    }

    isMoveRouteForcing(): boolean {
        return this._moveRouteForcing;
    }

    setMoveRoute(moveRoute: RPGMoveRoute): void {
        this._moveRoute = moveRoute;
        this._moveRouteIndex = 0;
        this._moveRouteForcing = false;
    }

    forceMoveRoute(moveRoute: RPGMoveRoute): void {
        if (!this._originalMoveRoute) {
            this.memorizeMoveRoute();
        }
        this._moveRoute = moveRoute;
        this._moveRouteIndex = 0;
        this._moveRouteForcing = true;
        this._waitCount = 0;
    }

    setCallerEventInfo(callerEventInfo: Record<string, unknown>): void {
        this._callerEventInfo = callerEventInfo;
    }

    updateStop(): void {
        super.updateStop();
        if (this._moveRouteForcing) {
            this.updateRoutineMove();
        }
    }

    updateRoutineMove(): void {
        if (this._waitCount > 0) {
            this._waitCount--;
        } else {
            this.setMovementSuccess(true);
            const command = this._moveRoute.list[this._moveRouteIndex];
            if (command) {
                this.processMoveCommand(command);
                this.advanceMoveRouteIndex();
            }
        }
    }

    processMoveCommand(command: RPGMoveCommand): void {
        const gc = Game_Character;
        const params = command.parameters;
        switch (command.code) {
            case gc.ROUTE_END:
                this.processRouteEnd();
                break;
            case gc.ROUTE_MOVE_DOWN:
                this.moveStraight(2);
                break;
            case gc.ROUTE_MOVE_LEFT:
                this.moveStraight(4);
                break;
            case gc.ROUTE_MOVE_RIGHT:
                this.moveStraight(6);
                break;
            case gc.ROUTE_MOVE_UP:
                this.moveStraight(8);
                break;
            case gc.ROUTE_MOVE_LOWER_L:
                this.moveDiagonally(4, 2);
                break;
            case gc.ROUTE_MOVE_LOWER_R:
                this.moveDiagonally(6, 2);
                break;
            case gc.ROUTE_MOVE_UPPER_L:
                this.moveDiagonally(4, 8);
                break;
            case gc.ROUTE_MOVE_UPPER_R:
                this.moveDiagonally(6, 8);
                break;
            case gc.ROUTE_MOVE_RANDOM:
                this.moveRandom();
                break;
            case gc.ROUTE_MOVE_TOWARD:
                this.moveTowardPlayer();
                break;
            case gc.ROUTE_MOVE_AWAY:
                this.moveAwayFromPlayer();
                break;
            case gc.ROUTE_MOVE_FORWARD:
                this.moveForward();
                break;
            case gc.ROUTE_MOVE_BACKWARD:
                this.moveBackward();
                break;
            case gc.ROUTE_JUMP:
                this.jump(params[0], params[1]);
                break;
            case gc.ROUTE_WAIT:
                this._waitCount = params[0] - 1;
                break;
            case gc.ROUTE_TURN_DOWN:
                this.setDirection(2);
                break;
            case gc.ROUTE_TURN_LEFT:
                this.setDirection(4);
                break;
            case gc.ROUTE_TURN_RIGHT:
                this.setDirection(6);
                break;
            case gc.ROUTE_TURN_UP:
                this.setDirection(8);
                break;
            case gc.ROUTE_TURN_90D_R:
                this.turnRight90();
                break;
            case gc.ROUTE_TURN_90D_L:
                this.turnLeft90();
                break;
            case gc.ROUTE_TURN_180D:
                this.turn180();
                break;
            case gc.ROUTE_TURN_90D_R_L:
                this.turnRightOrLeft90();
                break;
            case gc.ROUTE_TURN_RANDOM:
                this.turnRandom();
                break;
            case gc.ROUTE_TURN_TOWARD:
                this.turnTowardPlayer();
                break;
            case gc.ROUTE_TURN_AWAY:
                this.turnAwayFromPlayer();
                break;
            case gc.ROUTE_SWITCH_ON:
                window.$gameSwitches.setValue(params[0], true);
                break;
            case gc.ROUTE_SWITCH_OFF:
                window.$gameSwitches.setValue(params[0], false);
                break;
            case gc.ROUTE_CHANGE_SPEED:
                this.setMoveSpeed(params[0]);
                break;
            case gc.ROUTE_CHANGE_FREQ:
                this.setMoveFrequency(params[0]);
                break;
            case gc.ROUTE_WALK_ANIME_ON:
                this.setWalkAnime(true);
                break;
            case gc.ROUTE_WALK_ANIME_OFF:
                this.setWalkAnime(false);
                break;
            case gc.ROUTE_STEP_ANIME_ON:
                this.setStepAnime(true);
                break;
            case gc.ROUTE_STEP_ANIME_OFF:
                this.setStepAnime(false);
                break;
            case gc.ROUTE_DIR_FIX_ON:
                this.setDirectionFix(true);
                break;
            case gc.ROUTE_DIR_FIX_OFF:
                this.setDirectionFix(false);
                break;
            case gc.ROUTE_THROUGH_ON:
                this.setThrough(true);
                break;
            case gc.ROUTE_THROUGH_OFF:
                this.setThrough(false);
                break;
            case gc.ROUTE_TRANSPARENT_ON:
                this.setTransparent(true);
                break;
            case gc.ROUTE_TRANSPARENT_OFF:
                this.setTransparent(false);
                break;
            case gc.ROUTE_CHANGE_IMAGE:
                this.setImage(params[0], params[1]);
                break;
            case gc.ROUTE_CHANGE_OPACITY:
                this.setOpacity(params[0]);
                break;
            case gc.ROUTE_CHANGE_BLEND_MODE:
                this.setBlendMode(params[0]);
                break;
            case gc.ROUTE_PLAY_SE:
                AudioManager.playSe(params[0]);
                break;
            case gc.ROUTE_SCRIPT:
                try {
                    eval(params[0]);
                } catch (error) {
                    if (this._callerEventInfo) {
                        for (const key in this._callerEventInfo) {
                            error[key] = this._callerEventInfo[key];
                        }
                        error.line += this._moveRouteIndex + 1;
                        error.eventCommand = 'set_route_script';
                        error.content = command.parameters[0];
                    } else {
                        error.eventType = 'map_event';
                        error.mapId = this._mapId;
                        error.mapEventId = this._eventId;
                        error.page = this._pageIndex + 1;
                        error.line = this._moveRouteIndex + 1;
                        error.eventCommand = 'auto_route_script';
                        error.content = command.parameters[0];
                    }
                    throw error;
                }
                break;
        }
    }

    deltaXFrom(x: number): number {
        return window.$gameMap.deltaX(this.x, x);
    }

    deltaYFrom(y: number): number {
        return window.$gameMap.deltaY(this.y, y);
    }

    moveRandom(): void {
        const d = 2 + randomInt(4) * 2;
        if (this.canPass(this.x, this.y, d)) {
            this.moveStraight(d);
        }
    }

    moveTowardCharacter(character: Game_Character): void {
        const sx = this.deltaXFrom(character.x);
        const sy = this.deltaYFrom(character.y);
        if (Math.abs(sx) > Math.abs(sy)) {
            this.moveStraight(sx > 0 ? 4 : 6);
            if (!this.isMovementSucceeded() && sy !== 0) {
                this.moveStraight(sy > 0 ? 8 : 2);
            }
        } else if (sy !== 0) {
            this.moveStraight(sy > 0 ? 8 : 2);
            if (!this.isMovementSucceeded() && sx !== 0) {
                this.moveStraight(sx > 0 ? 4 : 6);
            }
        }
    }

    moveAwayFromCharacter(character: Game_Character): void {
        const sx = this.deltaXFrom(character.x);
        const sy = this.deltaYFrom(character.y);
        if (Math.abs(sx) > Math.abs(sy)) {
            this.moveStraight(sx > 0 ? 6 : 4);
            if (!this.isMovementSucceeded() && sy !== 0) {
                this.moveStraight(sy > 0 ? 2 : 8);
            }
        } else if (sy !== 0) {
            this.moveStraight(sy > 0 ? 2 : 8);
            if (!this.isMovementSucceeded() && sx !== 0) {
                this.moveStraight(sx > 0 ? 6 : 4);
            }
        }
    }

    turnTowardCharacter(character: Game_Character): void {
        const sx = this.deltaXFrom(character.x);
        const sy = this.deltaYFrom(character.y);
        if (Math.abs(sx) > Math.abs(sy)) {
            this.setDirection(sx > 0 ? 4 : 6);
        } else if (sy !== 0) {
            this.setDirection(sy > 0 ? 8 : 2);
        }
    }

    turnAwayFromCharacter(character: Game_Character): void {
        const sx = this.deltaXFrom(character.x);
        const sy = this.deltaYFrom(character.y);
        if (Math.abs(sx) > Math.abs(sy)) {
            this.setDirection(sx > 0 ? 6 : 4);
        } else if (sy !== 0) {
            this.setDirection(sy > 0 ? 2 : 8);
        }
    }

    turnTowardPlayer(): void {
        this.turnTowardCharacter(window.$gamePlayer);
    }

    turnAwayFromPlayer(): void {
        this.turnAwayFromCharacter(window.$gamePlayer);
    }

    moveTowardPlayer(): void {
        this.moveTowardCharacter(window.$gamePlayer);
    }

    moveAwayFromPlayer(): void {
        this.moveAwayFromCharacter(window.$gamePlayer);
    }

    moveForward(): void {
        this.moveStraight(this.direction());
    }

    moveBackward(): void {
        const lastDirectionFix = this.isDirectionFixed();
        this.setDirectionFix(true);
        this.moveStraight(this.reverseDir(this.direction()));
        this.setDirectionFix(lastDirectionFix);
    }

    processRouteEnd(): void {
        if (this._moveRoute.repeat) {
            this._moveRouteIndex = -1;
        } else if (this._moveRouteForcing) {
            this._moveRouteForcing = false;
            this.restoreMoveRoute();
        }
    }

    advanceMoveRouteIndex(): void {
        const moveRoute = this._moveRoute;
        if (moveRoute && (this.isMovementSucceeded() || moveRoute.skippable)) {
            const numCommands = moveRoute.list.length - 1;
            this._moveRouteIndex++;
            if (moveRoute.repeat && this._moveRouteIndex >= numCommands) {
                this._moveRouteIndex = 0;
            }
        }
    }

    turnRight90(): void {
        switch (this.direction()) {
            case 2:
                this.setDirection(4);
                break;
            case 4:
                this.setDirection(8);
                break;
            case 6:
                this.setDirection(2);
                break;
            case 8:
                this.setDirection(6);
                break;
        }
    }

    turnLeft90(): void {
        switch (this.direction()) {
            case 2:
                this.setDirection(6);
                break;
            case 4:
                this.setDirection(2);
                break;
            case 6:
                this.setDirection(8);
                break;
            case 8:
                this.setDirection(4);
                break;
        }
    }

    turn180(): void {
        this.setDirection(this.reverseDir(this.direction()));
    }

    turnRightOrLeft90(): void {
        switch (randomInt(2)) {
            case 0:
                this.turnRight90();
                break;
            case 1:
                this.turnLeft90();
                break;
        }
    }

    turnRandom(): void {
        this.setDirection(2 + randomInt(4) * 2);
    }

    swap(character: Game_Character): void {
        const newX = character.x;
        const newY = character.y;
        character.locate(this.x, this.y);
        this.locate(newX, newY);
    }

    findDirectionTo(goalX: number, goalY: number): number {
        type Node = {
            parent: Node;
            x: number;
            y: number;
            g: number;
            f: number;
        };

        const searchLimit = this.searchLimit();
        const mapWidth = window.$gameMap.width();
        const nodeList: Node[] = [];
        const openList: number[] = [];
        const closedList = [];
        const start = {} as Node;
        let best = start;

        if (this.x === goalX && this.y === goalY) {
            return 0;
        }

        start.parent = null;
        start.x = this.x;
        start.y = this.y;
        start.g = 0;
        start.f = window.$gameMap.distance(start.x, start.y, goalX, goalY);
        nodeList.push(start);
        openList.push(start.y * mapWidth + start.x);

        while (nodeList.length > 0) {
            let bestIndex = 0;
            for (let i = 0; i < nodeList.length; i++) {
                if (nodeList[i].f < nodeList[bestIndex].f) {
                    bestIndex = i;
                }
            }

            const current = nodeList[bestIndex];
            const x1 = current.x;
            const y1 = current.y;
            const pos1 = y1 * mapWidth + x1;
            const g1 = current.g;

            nodeList.splice(bestIndex, 1);
            openList.splice(openList.indexOf(pos1), 1);
            closedList.push(pos1);

            if (current.x === goalX && current.y === goalY) {
                best = current;
                break;
            }

            if (g1 >= searchLimit) {
                continue;
            }

            for (let j = 0; j < 4; j++) {
                const direction = 2 + j * 2;
                const x2 = window.$gameMap.roundXWithDirection(x1, direction);
                const y2 = window.$gameMap.roundYWithDirection(y1, direction);
                const pos2 = y2 * mapWidth + x2;

                if (closedList.includes(pos2)) {
                    continue;
                }
                if (!this.canPass(x1, y1, direction)) {
                    continue;
                }

                const g2 = g1 + 1;
                const index2 = openList.indexOf(pos2);

                if (index2 < 0 || g2 < nodeList[index2].g) {
                    let neighbor: Node;
                    if (index2 >= 0) {
                        neighbor = nodeList[index2];
                    } else {
                        neighbor = {} as Node;
                        nodeList.push(neighbor);
                        openList.push(pos2);
                    }
                    neighbor.parent = current;
                    neighbor.x = x2;
                    neighbor.y = y2;
                    neighbor.g = g2;
                    neighbor.f = g2 + window.$gameMap.distance(x2, y2, goalX, goalY);
                    if (!best || neighbor.f - neighbor.g < best.f - best.g) {
                        best = neighbor;
                    }
                }
            }
        }

        let node = best;
        while (node.parent && node.parent !== start) {
            node = node.parent;
        }

        const deltaX1 = window.$gameMap.deltaX(node.x, start.x);
        const deltaY1 = window.$gameMap.deltaY(node.y, start.y);
        if (deltaY1 > 0) {
            return 2;
        } else if (deltaX1 < 0) {
            return 4;
        } else if (deltaX1 > 0) {
            return 6;
        } else if (deltaY1 < 0) {
            return 8;
        }

        const deltaX2 = this.deltaXFrom(goalX);
        const deltaY2 = this.deltaYFrom(goalY);
        if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
            return deltaX2 > 0 ? 4 : 6;
        } else if (deltaY2 !== 0) {
            return deltaY2 > 0 ? 8 : 2;
        }

        return 0;
    }

    searchLimit(): number {
        return 12;
    }
}
