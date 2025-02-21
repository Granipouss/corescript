import { randomInt } from '../rpg_core/extension';
import type { RPGEvent } from '../rpg_data/event';
import type { RPGEventCommand } from '../rpg_data/event-command';
import type { RPGEventPage } from '../rpg_data/event-page';
import type { RPGMoveRoute } from '../rpg_data/move-route';
import { Game_Character } from './Game_Character';
import type { EventInfo } from './Game_Interpreter';
import { Game_Interpreter } from './Game_Interpreter';

/**
 * The game object class for an event. It contains functionality for event page
 * switching and running parallel process events.
 */
export class Game_Event extends Game_Character {
    private _moveType: number;
    private _trigger: number;
    private _starting: boolean;
    private _erased: boolean;
    private _originalPattern: number;
    private _originalDirection: number;
    private _prelockDirection: number;
    private _locked: boolean;
    private _interpreter: Game_Interpreter;

    constructor(mapId: number, eventId: number) {
        super();
        this._mapId = mapId;
        this._eventId = eventId;
        this.locate(this.event().x, this.event().y);
        this.refresh();
    }

    initMembers(): void {
        super.initMembers();
        this._moveType = 0;
        this._trigger = 0;
        this._starting = false;
        this._erased = false;
        this._pageIndex = -2;
        this._originalPattern = 1;
        this._originalDirection = 2;
        this._prelockDirection = 0;
        this._locked = false;
    }

    eventId(): number {
        return this._eventId;
    }

    event(): RPGEvent {
        return window.$dataMap.events[this._eventId];
    }

    page(): RPGEventPage {
        return this.event().pages[this._pageIndex];
    }

    list(): readonly RPGEventCommand[] {
        return this.page().list;
    }

    isCollidedWithCharacters(x: number, y: number): boolean {
        return super.isCollidedWithCharacters(x, y) || this.isCollidedWithPlayerCharacters(x, y);
    }

    isCollidedWithEvents(x: number, y: number): boolean {
        const events = window.$gameMap.eventsXyNt(x, y);
        return events.length > 0;
    }

    isCollidedWithPlayerCharacters(x: number, y: number): boolean {
        return this.isNormalPriority() && window.$gamePlayer.isCollided(x, y);
    }

    lock(): void {
        if (!this._locked) {
            this._prelockDirection = this.direction();
            this.turnTowardPlayer();
            this._locked = true;
        }
    }

    unlock(): void {
        if (this._locked) {
            this._locked = false;
            this.setDirection(this._prelockDirection);
        }
    }

    updateStop(): void {
        if (this._locked) {
            this.resetStopCount();
        }
        super.updateStop();
        if (!this.isMoveRouteForcing()) {
            this.updateSelfMovement();
        }
    }

    updateSelfMovement(): void {
        if (!this._locked && this.isNearTheScreen() && this.checkStop(this.stopCountThreshold())) {
            switch (this._moveType) {
                case 1:
                    this.moveTypeRandom();
                    break;
                case 2:
                    this.moveTypeTowardPlayer();
                    break;
                case 3:
                    this.moveTypeCustom();
                    break;
            }
        }
    }

    stopCountThreshold(): number {
        return 30 * (5 - this.moveFrequency());
    }

    moveTypeRandom(): void {
        switch (randomInt(6)) {
            case 0:
            case 1:
                this.moveRandom();
                break;
            case 2:
            case 3:
            case 4:
                this.moveForward();
                break;
            case 5:
                this.resetStopCount();
                break;
        }
    }

    moveTypeTowardPlayer(): void {
        if (this.isNearThePlayer()) {
            switch (randomInt(6)) {
                case 0:
                case 1:
                case 2:
                case 3:
                    this.moveTowardPlayer();
                    break;
                case 4:
                    this.moveRandom();
                    break;
                case 5:
                    this.moveForward();
                    break;
            }
        } else {
            this.moveRandom();
        }
    }

    isNearThePlayer(): boolean {
        const sx = Math.abs(this.deltaXFrom(window.$gamePlayer.x));
        const sy = Math.abs(this.deltaYFrom(window.$gamePlayer.y));
        return sx + sy < 20;
    }

    moveTypeCustom(): void {
        this.updateRoutineMove();
    }

    isStarting(): boolean {
        return this._starting;
    }

    clearStartingFlag(): void {
        this._starting = false;
    }

    isTriggerIn(triggers: number[]): boolean {
        return triggers.includes(this._trigger);
    }

    start(): void {
        const list = this.list();
        if (list && list.length > 1) {
            this._starting = true;
            if (this.isTriggerIn([0, 1, 2])) {
                this.lock();
            }
        }
    }

    erase(): void {
        this._erased = true;
        this.refresh();
    }

    refresh(): void {
        const newPageIndex = this._erased ? -1 : this.findProperPageIndex();
        if (this._pageIndex !== newPageIndex) {
            this._pageIndex = newPageIndex;
            this.setupPage();
        }
    }

    findProperPageIndex(): number {
        const pages = this.event().pages;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (this.meetsConditions(page)) {
                return i;
            }
        }
        return -1;
    }

    meetsConditions(page: RPGEventPage): boolean {
        const c = page.conditions;
        if (c.switch1Valid) {
            if (!window.$gameSwitches.value(c.switch1Id)) {
                return false;
            }
        }
        if (c.switch2Valid) {
            if (!window.$gameSwitches.value(c.switch2Id)) {
                return false;
            }
        }
        if (c.variableValid) {
            if (window.$gameVariables.value(c.variableId) < c.variableValue) {
                return false;
            }
        }
        if (c.selfSwitchValid) {
            const key = [this._mapId, this._eventId, c.selfSwitchCh] as const;
            if (window.$gameSelfSwitches.value(key) !== true) {
                return false;
            }
        }
        if (c.itemValid) {
            const item = window.$dataItems[c.itemId];
            if (!window.$gameParty.hasItem(item)) {
                return false;
            }
        }
        if (c.actorValid) {
            const actor = window.$gameActors.actor(c.actorId);
            if (!window.$gameParty.members().includes(actor)) {
                return false;
            }
        }
        return true;
    }

    setupPage(): void {
        if (this._pageIndex >= 0) {
            this.setupPageSettings();
        } else {
            this.clearPageSettings();
        }
        this.refreshBushDepth();
        this.clearStartingFlag();
        this.checkEventTriggerAuto();
    }

    clearPageSettings(): void {
        this.setImage('', 0);
        this._moveType = 0;
        this._trigger = null;
        this._interpreter = null;
        this.setThrough(true);
    }

    setupPageSettings(): void {
        const page = this.page();
        const image = page.image;
        if (image.tileId > 0) {
            this.setTileImage(image.tileId);
        } else {
            this.setImage(image.characterName, image.characterIndex);
        }
        if (this._originalDirection !== image.direction) {
            this._originalDirection = image.direction;
            this._prelockDirection = 0;
            this.setDirectionFix(false);
            this.setDirection(image.direction);
        }
        if (this._originalPattern !== image.pattern) {
            this._originalPattern = image.pattern;
            this.setPattern(image.pattern);
        }
        this.setMoveSpeed(page.moveSpeed);
        this.setMoveFrequency(page.moveFrequency);
        this.setPriorityType(page.priorityType);
        this.setWalkAnime(page.walkAnime);
        this.setStepAnime(page.stepAnime);
        this.setDirectionFix(page.directionFix);
        this.setThrough(page.through);
        this.setMoveRoute(page.moveRoute);
        this._moveType = page.moveType;
        this._trigger = page.trigger;
        if (this._trigger === 4) {
            this._interpreter = new Game_Interpreter();
        } else {
            this._interpreter = null;
        }
    }

    isOriginalPattern(): boolean {
        return this.pattern() === this._originalPattern;
    }

    resetPattern(): void {
        this.setPattern(this._originalPattern);
    }

    checkEventTriggerTouch(x: number, y: number): void {
        if (!window.$gameMap.isEventRunning()) {
            if (this._trigger === 2 && window.$gamePlayer.pos(x, y)) {
                if (!this.isJumping() && this.isNormalPriority()) {
                    this.start();
                }
            }
        }
    }

    checkEventTriggerAuto(): void {
        if (this._trigger === 3) {
            this.start();
        }
    }

    update(): void {
        super.update();
        this.checkEventTriggerAuto();
        this.updateParallel();
    }

    updateParallel(): void {
        if (this._interpreter) {
            if (!this._interpreter.isRunning()) {
                this._interpreter.setup(this.list(), this._eventId);
                this._interpreter.setEventInfo(this.getEventInfo());
            }
            this._interpreter.update();
        }
    }

    locate(x: number, y: number): void {
        super.locate(x, y);
        this._prelockDirection = 0;
    }

    forceMoveRoute(moveRoute: RPGMoveRoute): void {
        super.forceMoveRoute(moveRoute);
        this._prelockDirection = 0;
    }

    getEventInfo(): EventInfo {
        return {
            eventType: 'map_event',
            mapId: this._mapId,
            mapEventId: this._eventId,
            page: this._pageIndex + 1,
        };
    }
}
