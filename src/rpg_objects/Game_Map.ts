import { clamp, mod } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import type { RPGCommonEvent } from '../rpg_data/common-event';
import type { MapEncounter } from '../rpg_data/map';
import type { RPGTileset } from '../rpg_data/tileset';
import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { Game_CommonEvent } from './Game_CommonEvent';
import { Game_Event } from './Game_Event';
import { Game_Interpreter } from './Game_Interpreter';
import { Game_Vehicle } from './Game_Vehicle';

/**
 * The game object class for a map. It contains scrolling and passage
 * determination functions.
 */
export class Game_Map {
    private _interpreter: Game_Interpreter;
    private _mapId: number;
    private _tilesetId: number;
    private _events: Game_Event[];
    private _commonEvents: Game_CommonEvent[];
    private _vehicles: Game_Vehicle[];
    private _displayX: number;
    private _displayY: number;
    private _nameDisplay: boolean;
    private _scrollDirection: number;
    private _scrollRest: number;
    private _scrollSpeed: number;
    private _parallaxName: string;
    private _parallaxZero: boolean;
    private _parallaxLoopX: boolean;
    private _parallaxLoopY: boolean;
    private _parallaxSx: number;
    private _parallaxSy: number;
    private _parallaxX: number;
    private _parallaxY: number;
    private _battleback1Name: string;
    private _battleback2Name: string;
    private _needsRefresh: boolean;

    tileEvents: Game_Event[];

    constructor() {
        this._interpreter = new Game_Interpreter();
        this._mapId = 0;
        this._tilesetId = 0;
        this._events = [];
        this._commonEvents = [];
        this._vehicles = [];
        this._displayX = 0;
        this._displayY = 0;
        this._nameDisplay = true;
        this._scrollDirection = 2;
        this._scrollRest = 0;
        this._scrollSpeed = 4;
        this._parallaxName = '';
        this._parallaxZero = false;
        this._parallaxLoopX = false;
        this._parallaxLoopY = false;
        this._parallaxSx = 0;
        this._parallaxSy = 0;
        this._parallaxX = 0;
        this._parallaxY = 0;
        this._battleback1Name = null;
        this._battleback2Name = null;
        this.createVehicles();
    }

    setup(mapId: number): void {
        if (!window.$dataMap) {
            throw new Error('The map data is not available');
        }
        this._mapId = mapId;
        this._tilesetId = window.$dataMap.tilesetId;
        this._displayX = 0;
        this._displayY = 0;
        this.refereshVehicles();
        this.setupEvents();
        this.setupScroll();
        this.setupParallax();
        this.setupBattleback();
        this._needsRefresh = false;
    }

    isEventRunning(): boolean {
        return this._interpreter.isRunning() || this.isAnyEventStarting();
    }

    tileWidth(): number {
        return 48;
    }

    tileHeight(): number {
        return 48;
    }

    mapId(): number {
        return this._mapId;
    }

    tilesetId(): number {
        return this._tilesetId;
    }

    displayX(): number {
        return this._displayX;
    }

    displayY(): number {
        return this._displayY;
    }

    parallaxName(): string {
        return this._parallaxName;
    }

    battleback1Name(): string {
        return this._battleback1Name;
    }

    battleback2Name(): string {
        return this._battleback2Name;
    }

    requestRefresh(_mapId = 0): void {
        this._needsRefresh = true;
    }

    isNameDisplayEnabled(): boolean {
        return this._nameDisplay;
    }

    disableNameDisplay(): void {
        this._nameDisplay = false;
    }

    enableNameDisplay(): void {
        this._nameDisplay = true;
    }

    createVehicles(): void {
        this._vehicles = [];
        this._vehicles[0] = new Game_Vehicle('boat');
        this._vehicles[1] = new Game_Vehicle('ship');
        this._vehicles[2] = new Game_Vehicle('airship');
    }

    refereshVehicles(): void {
        this._vehicles.forEach((vehicle) => {
            vehicle.refresh();
        });
    }

    vehicles(): Game_Vehicle[] {
        return this._vehicles;
    }

    vehicle(type: string | number): Game_Vehicle {
        if (type === 0 || type === 'boat') {
            return this.boat();
        } else if (type === 1 || type === 'ship') {
            return this.ship();
        } else if (type === 2 || type === 'airship') {
            return this.airship();
        } else {
            return null;
        }
    }

    boat(): Game_Vehicle {
        return this._vehicles[0];
    }

    ship(): Game_Vehicle {
        return this._vehicles[1];
    }

    airship(): Game_Vehicle {
        return this._vehicles[2];
    }

    setupEvents(): void {
        this._events = [];
        for (let i = 0; i < window.$dataMap.events.length; i++) {
            if (window.$dataMap.events[i]) {
                this._events[i] = new Game_Event(this._mapId, i);
            }
        }
        this._commonEvents = this.parallelCommonEvents().map((commonEvent) => new Game_CommonEvent(commonEvent.id));
        this.refreshTileEvents();
    }

    events(): Game_Event[] {
        return this._events.filter((event) => !!event);
    }

    event(eventId: number): Game_Event {
        return this._events[eventId];
    }

    eraseEvent(eventId: number): void {
        this._events[eventId].erase();
    }

    parallelCommonEvents(): RPGCommonEvent[] {
        return window.$dataCommonEvents.filter((commonEvent) => commonEvent && commonEvent.trigger === 2);
    }

    setupScroll(): void {
        this._scrollDirection = 2;
        this._scrollRest = 0;
        this._scrollSpeed = 4;
    }

    setupParallax(): void {
        this._parallaxName = window.$dataMap.parallaxName || '';
        this._parallaxZero = ImageManager.isZeroParallax(this._parallaxName);
        this._parallaxLoopX = window.$dataMap.parallaxLoopX;
        this._parallaxLoopY = window.$dataMap.parallaxLoopY;
        this._parallaxSx = window.$dataMap.parallaxSx;
        this._parallaxSy = window.$dataMap.parallaxSy;
        this._parallaxX = 0;
        this._parallaxY = 0;
    }

    setupBattleback(): void {
        if (window.$dataMap.specifyBattleback) {
            this._battleback1Name = window.$dataMap.battleback1Name;
            this._battleback2Name = window.$dataMap.battleback2Name;
        } else {
            this._battleback1Name = null;
            this._battleback2Name = null;
        }
    }

    setDisplayPos(x: number, y: number): void {
        if (this.isLoopHorizontal()) {
            this._displayX = mod(x, this.width());
            this._parallaxX = x;
        } else {
            const endX = this.width() - this.screenTileX();
            this._displayX = endX < 0 ? endX / 2 : clamp(x, [0, endX]);
            this._parallaxX = this._displayX;
        }
        if (this.isLoopVertical()) {
            this._displayY = mod(y, this.height());
            this._parallaxY = y;
        } else {
            const endY = this.height() - this.screenTileY();
            this._displayY = endY < 0 ? endY / 2 : clamp(y, [0, endY]);
            this._parallaxY = this._displayY;
        }
    }

    parallaxOx(): number {
        if (this._parallaxZero) {
            return this._parallaxX * this.tileWidth();
        } else if (this._parallaxLoopX) {
            return (this._parallaxX * this.tileWidth()) / 2;
        } else {
            return 0;
        }
    }

    parallaxOy(): number {
        if (this._parallaxZero) {
            return this._parallaxY * this.tileHeight();
        } else if (this._parallaxLoopY) {
            return (this._parallaxY * this.tileHeight()) / 2;
        } else {
            return 0;
        }
    }

    tileset(): RPGTileset {
        return window.$dataTilesets[this._tilesetId];
    }

    tilesetFlags(): readonly number[] {
        const tileset = this.tileset();
        if (tileset) {
            return tileset.flags;
        } else {
            return [];
        }
    }

    displayName(): string {
        return window.$dataMap.displayName;
    }

    width(): number {
        return window.$dataMap.width;
    }

    height(): number {
        return window.$dataMap.height;
    }

    data(): readonly number[] {
        return window.$dataMap.data;
    }

    isLoopHorizontal(): boolean {
        return window.$dataMap.scrollType === 2 || window.$dataMap.scrollType === 3;
    }

    isLoopVertical(): boolean {
        return window.$dataMap.scrollType === 1 || window.$dataMap.scrollType === 3;
    }

    isDashDisabled(): boolean {
        return window.$dataMap.disableDashing;
    }

    encounterList(): readonly MapEncounter[] {
        return window.$dataMap.encounterList;
    }

    encounterStep(): number {
        return window.$dataMap.encounterStep;
    }

    isOverworld(): boolean {
        return this.tileset() && this.tileset().mode === 0;
    }

    screenTileX(): number {
        return Graphics.width / this.tileWidth();
    }

    screenTileY(): number {
        return Graphics.height / this.tileHeight();
    }

    adjustX(x: number): number {
        if (this.isLoopHorizontal() && x < this._displayX - (this.width() - this.screenTileX()) / 2) {
            return x - this._displayX + window.$dataMap.width;
        } else {
            return x - this._displayX;
        }
    }

    adjustY(y: number): number {
        if (this.isLoopVertical() && y < this._displayY - (this.height() - this.screenTileY()) / 2) {
            return y - this._displayY + window.$dataMap.height;
        } else {
            return y - this._displayY;
        }
    }

    roundX(x: number): number {
        return this.isLoopHorizontal() ? mod(x, this.width()) : x;
    }

    roundY(y: number): number {
        return this.isLoopVertical() ? mod(y, this.height()) : y;
    }

    xWithDirection(x: number, d: number): number {
        return x + (d === 6 ? 1 : d === 4 ? -1 : 0);
    }

    yWithDirection(y: number, d: number): number {
        return y + (d === 2 ? 1 : d === 8 ? -1 : 0);
    }

    roundXWithDirection(x: number, d: number): number {
        return this.roundX(x + (d === 6 ? 1 : d === 4 ? -1 : 0));
    }

    roundYWithDirection(y: number, d: number): number {
        return this.roundY(y + (d === 2 ? 1 : d === 8 ? -1 : 0));
    }

    deltaX(x1: number, x2: number): number {
        let result = x1 - x2;
        if (this.isLoopHorizontal() && Math.abs(result) > this.width() / 2) {
            if (result < 0) {
                result += this.width();
            } else {
                result -= this.width();
            }
        }
        return result;
    }

    deltaY(y1: number, y2: number): number {
        let result = y1 - y2;
        if (this.isLoopVertical() && Math.abs(result) > this.height() / 2) {
            if (result < 0) {
                result += this.height();
            } else {
                result -= this.height();
            }
        }
        return result;
    }

    distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.abs(this.deltaX(x1, x2)) + Math.abs(this.deltaY(y1, y2));
    }

    canvasToMapX(x: number): number {
        const tileWidth = this.tileWidth();
        const originX = this._displayX * tileWidth;
        const mapX = Math.floor((originX + x) / tileWidth);
        return this.roundX(mapX);
    }

    canvasToMapY(y: number): number {
        const tileHeight = this.tileHeight();
        const originY = this._displayY * tileHeight;
        const mapY = Math.floor((originY + y) / tileHeight);
        return this.roundY(mapY);
    }

    autoplay(): void {
        if (window.$dataMap.autoplayBgm) {
            if (window.$gamePlayer.isInVehicle()) {
                window.$gameSystem.saveWalkingBgm2();
            } else {
                AudioManager.playBgm(window.$dataMap.bgm);
            }
        }
        if (window.$dataMap.autoplayBgs) {
            AudioManager.playBgs(window.$dataMap.bgs);
        }
    }

    refreshIfNeeded(): void {
        if (this._needsRefresh) {
            this.refresh();
        }
    }

    refresh(): void {
        this.events().forEach((event) => {
            event.refresh();
        });
        this._commonEvents.forEach((event) => {
            event.refresh();
        });
        this.refreshTileEvents();
        this._needsRefresh = false;
    }

    refreshTileEvents(): void {
        this.tileEvents = this.events().filter((event) => event.isTile());
    }

    eventsXy(x: number, y: number): Game_Event[] {
        return this.events().filter((event) => event.pos(x, y));
    }

    eventsXyNt(x: number, y: number): Game_Event[] {
        return this.events().filter((event) => event.posNt(x, y));
    }

    tileEventsXy(x: number, y: number): Game_Event[] {
        return this.tileEvents.filter((event) => event.posNt(x, y));
    }

    eventIdXy(x: number, y: number): number {
        const list = this.eventsXy(x, y);
        return list.length === 0 ? 0 : list[0].eventId();
    }

    scrollDown(distance: number): void {
        if (this.isLoopVertical()) {
            this._displayY += distance;
            this._displayY %= window.$dataMap.height;
            if (this._parallaxLoopY) {
                this._parallaxY += distance;
            }
        } else if (this.height() >= this.screenTileY()) {
            const lastY = this._displayY;
            this._displayY = Math.min(this._displayY + distance, this.height() - this.screenTileY());
            this._parallaxY += this._displayY - lastY;
        }
    }

    scrollLeft(distance: number): void {
        if (this.isLoopHorizontal()) {
            this._displayX += window.$dataMap.width - distance;
            this._displayX %= window.$dataMap.width;
            if (this._parallaxLoopX) {
                this._parallaxX -= distance;
            }
        } else if (this.width() >= this.screenTileX()) {
            const lastX = this._displayX;
            this._displayX = Math.max(this._displayX - distance, 0);
            this._parallaxX += this._displayX - lastX;
        }
    }

    scrollRight(distance: number): void {
        if (this.isLoopHorizontal()) {
            this._displayX += distance;
            this._displayX %= window.$dataMap.width;
            if (this._parallaxLoopX) {
                this._parallaxX += distance;
            }
        } else if (this.width() >= this.screenTileX()) {
            const lastX = this._displayX;
            this._displayX = Math.min(this._displayX + distance, this.width() - this.screenTileX());
            this._parallaxX += this._displayX - lastX;
        }
    }

    scrollUp(distance: number): void {
        if (this.isLoopVertical()) {
            this._displayY += window.$dataMap.height - distance;
            this._displayY %= window.$dataMap.height;
            if (this._parallaxLoopY) {
                this._parallaxY -= distance;
            }
        } else if (this.height() >= this.screenTileY()) {
            const lastY = this._displayY;
            this._displayY = Math.max(this._displayY - distance, 0);
            this._parallaxY += this._displayY - lastY;
        }
    }

    isValid(x: number, y: number): boolean {
        return x >= 0 && x < this.width() && y >= 0 && y < this.height();
    }

    checkPassage(x: number, y: number, bit: number): boolean {
        const flags = this.tilesetFlags();
        const tiles = this.allTiles(x, y);
        for (let i = 0; i < tiles.length; i++) {
            const flag = flags[tiles[i]];
            if ((flag & 0x10) !== 0)
                // [*] No effect on passage
                continue;
            if ((flag & bit) === 0)
                // [o] Passable
                return true;
            if ((flag & bit) === bit)
                // [x] Impassable
                return false;
        }
        return false;
    }

    tileId(x: number, y: number, z: number): number {
        const width = window.$dataMap.width;
        const height = window.$dataMap.height;
        return window.$dataMap.data[(z * height + y) * width + x] || 0;
    }

    layeredTiles(x: number, y: number): number[] {
        const tiles = [];
        for (let i = 0; i < 4; i++) {
            tiles.push(this.tileId(x, y, 3 - i));
        }
        return tiles;
    }

    allTiles(x: number, y: number): number[] {
        const tiles = this.tileEventsXy(x, y).map((event) => event.tileId());
        return tiles.concat(this.layeredTiles(x, y));
    }

    autotileType(x: number, y: number, z: number): number {
        const tileId = this.tileId(x, y, z);
        return tileId >= 2048 ? Math.floor((tileId - 2048) / 48) : -1;
    }

    isPassable(x: number, y: number, d: number): boolean {
        return this.checkPassage(x, y, (1 << (d / 2 - 1)) & 0x0f);
    }

    isBoatPassable(x: number, y: number): boolean {
        return this.checkPassage(x, y, 0x0200);
    }

    isShipPassable(x: number, y: number): boolean {
        return this.checkPassage(x, y, 0x0400);
    }

    isAirshipLandOk(x: number, y: number): boolean {
        return this.checkPassage(x, y, 0x0800) && this.checkPassage(x, y, 0x0f);
    }

    checkLayeredTilesFlags(x: number, y: number, bit: number): boolean {
        const flags = this.tilesetFlags();
        return this.layeredTiles(x, y).some((tileId) => flags[tileId] & (bit !== 0 ? 1 : 0));
    }

    isLadder(x: number, y: number): boolean {
        return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x20);
    }

    isBush(x: number, y: number): boolean {
        return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x40);
    }

    isCounter(x: number, y: number): boolean {
        return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x80);
    }

    isDamageFloor(x: number, y: number): boolean {
        return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x100);
    }

    terrainTag(x: number, y: number): number {
        if (this.isValid(x, y)) {
            const flags = this.tilesetFlags();
            const tiles = this.layeredTiles(x, y);
            for (let i = 0; i < tiles.length; i++) {
                const tag = flags[tiles[i]] >> 12;
                if (tag > 0) {
                    return tag;
                }
            }
        }
        return 0;
    }

    regionId(x: number, y: number): number {
        return this.isValid(x, y) ? this.tileId(x, y, 5) : 0;
    }

    startScroll(direction: number, distance: number, speed: number): void {
        this._scrollDirection = direction;
        this._scrollRest = distance;
        this._scrollSpeed = speed;
    }

    isScrolling(): boolean {
        return this._scrollRest > 0;
    }

    update(sceneActive = false): void {
        this.refreshIfNeeded();
        if (sceneActive) {
            this.updateInterpreter();
        }
        this.updateScroll();
        this.updateEvents();
        this.updateVehicles();
        this.updateParallax();
    }

    updateScroll(): void {
        if (this.isScrolling()) {
            const lastX = this._displayX;
            const lastY = this._displayY;
            this.doScroll(this._scrollDirection, this.scrollDistance());
            if (this._displayX === lastX && this._displayY === lastY) {
                this._scrollRest = 0;
            } else {
                this._scrollRest -= this.scrollDistance();
            }
        }
    }

    scrollDistance(): number {
        return Math.pow(2, this._scrollSpeed) / 256;
    }

    doScroll(direction: number, distance: number): void {
        switch (direction) {
            case 2:
                this.scrollDown(distance);
                break;
            case 4:
                this.scrollLeft(distance);
                break;
            case 6:
                this.scrollRight(distance);
                break;
            case 8:
                this.scrollUp(distance);
                break;
        }
    }

    updateEvents(): void {
        this.events().forEach((event) => {
            event.update();
        });
        this._commonEvents.forEach((event) => {
            event.update();
        });
    }

    updateVehicles(): void {
        this._vehicles.forEach((vehicle) => {
            vehicle.update();
        });
    }

    updateParallax(): void {
        if (this._parallaxLoopX) {
            this._parallaxX += this._parallaxSx / this.tileWidth() / 2;
        }
        if (this._parallaxLoopY) {
            this._parallaxY += this._parallaxSy / this.tileHeight() / 2;
        }
    }

    changeTileset(tilesetId: number): void {
        this._tilesetId = tilesetId;
        this.refresh();
    }

    changeBattleback(battleback1Name: string, battleback2Name: string): void {
        this._battleback1Name = battleback1Name;
        this._battleback2Name = battleback2Name;
    }

    changeParallax(name: string, loopX: boolean, loopY: boolean, sx: number, sy: number): void {
        this._parallaxName = name;
        this._parallaxZero = ImageManager.isZeroParallax(this._parallaxName);
        if (this._parallaxLoopX && !loopX) {
            this._parallaxX = 0;
        }
        if (this._parallaxLoopY && !loopY) {
            this._parallaxY = 0;
        }
        this._parallaxLoopX = loopX;
        this._parallaxLoopY = loopY;
        this._parallaxSx = sx;
        this._parallaxSy = sy;
    }

    updateInterpreter(): void {
        for (;;) {
            this._interpreter.update();
            if (this._interpreter.isRunning()) {
                return;
            }
            if (this._interpreter.eventId() > 0) {
                this.unlockEvent(this._interpreter.eventId());
                this._interpreter.clear();
            }
            if (!this.setupStartingEvent()) {
                return;
            }
        }
    }

    unlockEvent(eventId: number): void {
        if (this._events[eventId]) {
            this._events[eventId].unlock();
        }
    }

    setupStartingEvent(): boolean {
        this.refreshIfNeeded();
        if (this._interpreter.setupReservedCommonEvent()) {
            return true;
        }
        if (this.setupTestEvent()) {
            return true;
        }
        if (this.setupStartingMapEvent()) {
            return true;
        }
        if (this.setupAutorunCommonEvent()) {
            return true;
        }
        return false;
    }

    setupTestEvent(): boolean {
        if (window.$testEvent) {
            this._interpreter.setup(window.$testEvent, 0);
            this._interpreter.setEventInfo({ eventType: 'test_event' });
            window.$testEvent = null;
            return true;
        }
        return false;
    }

    setupStartingMapEvent(): boolean {
        const events = this.events();
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (event.isStarting()) {
                event.clearStartingFlag();
                this._interpreter.setup(event.list(), event.eventId());
                this._interpreter.setEventInfo(event.getEventInfo());
                return true;
            }
        }
        return false;
    }

    setupAutorunCommonEvent(): boolean {
        for (let i = 0; i < window.$dataCommonEvents.length; i++) {
            const event = window.$dataCommonEvents[i];
            if (event && event.trigger === 1 && window.$gameSwitches.value(event.switchId)) {
                this._interpreter.setup(event.list);
                this._interpreter.setEventInfo({
                    eventType: 'common_event',
                    commonEventId: i,
                });
                return true;
            }
        }
        return false;
    }

    isAnyEventStarting(): boolean {
        return this.events().some((event) => event.isStarting());
    }
}
