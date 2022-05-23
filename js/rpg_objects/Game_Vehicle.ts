import { AudioFile } from '../rpg_data/audio-file';
import { RPGSystemVehicle } from '../rpg_data/system';
import { AudioManager } from '../rpg_managers/AudioManager';
import { Game_Character } from './Game_Character';

/**
 * The game object class for a vehicle.
 */
export class Game_Vehicle extends Game_Character {
    private _type: string;
    private _altitude: number;
    private _driving: boolean;
    private _bgm: AudioFile;

    constructor(type: string) {
        super();
        this._type = type;
        this.resetDirection();
        this.initMoveSpeed();
        this.loadSystemSettings();
    }

    initMembers(): void {
        super.initMembers();
        this._type = '';
        this._mapId = 0;
        this._altitude = 0;
        this._driving = false;
        this._bgm = null;
    }

    isBoat(): boolean {
        return this._type === 'boat';
    }

    isShip(): boolean {
        return this._type === 'ship';
    }

    isAirship(): boolean {
        return this._type === 'airship';
    }

    resetDirection(): void {
        this.setDirection(4);
    }

    initMoveSpeed(): void {
        if (this.isBoat()) {
            this.setMoveSpeed(4);
        } else if (this.isShip()) {
            this.setMoveSpeed(5);
        } else if (this.isAirship()) {
            this.setMoveSpeed(6);
        }
    }

    vehicle(): RPGSystemVehicle {
        if (this.isBoat()) {
            return window.$dataSystem.boat;
        } else if (this.isShip()) {
            return window.$dataSystem.ship;
        } else if (this.isAirship()) {
            return window.$dataSystem.airship;
        } else {
            return null;
        }
    }

    loadSystemSettings(): void {
        const vehicle = this.vehicle();
        this._mapId = vehicle.startMapId;
        this.setPosition(vehicle.startX, vehicle.startY);
        this.setImage(vehicle.characterName, vehicle.characterIndex);
    }

    refresh(): void {
        if (this._driving) {
            this._mapId = window.$gameMap.mapId();
            this.syncWithPlayer();
        } else if (this._mapId === window.$gameMap.mapId()) {
            this.locate(this.x, this.y);
        }
        if (this.isAirship()) {
            this.setPriorityType(this._driving ? 2 : 0);
        } else {
            this.setPriorityType(1);
        }
        this.setWalkAnime(this._driving);
        this.setStepAnime(this._driving);
        this.setTransparent(this._mapId !== window.$gameMap.mapId());
    }

    setLocation(mapId: number, x: number, y: number): void {
        this._mapId = mapId;
        this.setPosition(x, y);
        this.refresh();
    }

    pos(x: number, y: number): boolean {
        if (this._mapId === window.$gameMap.mapId()) {
            return super.pos(x, y);
        } else {
            return false;
        }
    }

    isMapPassable(x: number, y: number, d: number): boolean {
        const x2 = window.$gameMap.roundXWithDirection(x, d);
        const y2 = window.$gameMap.roundYWithDirection(y, d);
        if (this.isBoat()) {
            return window.$gameMap.isBoatPassable(x2, y2);
        } else if (this.isShip()) {
            return window.$gameMap.isShipPassable(x2, y2);
        } else if (this.isAirship()) {
            return true;
        } else {
            return false;
        }
    }

    getOn(): void {
        this._driving = true;
        this.setWalkAnime(true);
        this.setStepAnime(true);
        window.$gameSystem.saveWalkingBgm();
        this.playBgm();
    }

    getOff(): void {
        this._driving = false;
        this.setWalkAnime(false);
        this.setStepAnime(false);
        this.resetDirection();
        window.$gameSystem.replayWalkingBgm();
    }

    setBgm(bgm: AudioFile): void {
        this._bgm = bgm;
    }

    playBgm(): void {
        AudioManager.playBgm(this._bgm || this.vehicle().bgm);
    }

    syncWithPlayer(): void {
        this.copyPosition(window.$gamePlayer);
        this.refreshBushDepth();
    }

    screenY(): number {
        return super.screenY() - this._altitude;
    }

    shadowX(): number {
        return this.screenX();
    }

    shadowY(): number {
        return this.screenY() + this._altitude;
    }

    shadowOpacity(): number {
        return (255 * this._altitude) / this.maxAltitude();
    }

    canMove(): boolean {
        if (this.isAirship()) {
            return this.isHighest();
        } else {
            return true;
        }
    }

    update(): void {
        super.update();
        if (this.isAirship()) {
            this.updateAirship();
        }
    }

    updateAirship(): void {
        this.updateAirshipAltitude();
        this.setStepAnime(this.isHighest());
        this.setPriorityType(this.isLowest() ? 0 : 2);
    }

    updateAirshipAltitude(): void {
        if (this._driving && !this.isHighest()) {
            this._altitude++;
        }
        if (!this._driving && !this.isLowest()) {
            this._altitude--;
        }
    }

    maxAltitude(): number {
        return 48;
    }

    isLowest(): boolean {
        return this._altitude <= 0;
    }

    isHighest(): boolean {
        return this._altitude >= this.maxAltitude();
    }

    isTakeoffOk(): boolean {
        return window.$gamePlayer.areFollowersGathered();
    }

    isLandOk(x: number, y: number, d: number): boolean {
        if (this.isAirship()) {
            if (!window.$gameMap.isAirshipLandOk(x, y)) {
                return false;
            }
            if (window.$gameMap.eventsXy(x, y).length > 0) {
                return false;
            }
        } else {
            const x2 = window.$gameMap.roundXWithDirection(x, d);
            const y2 = window.$gameMap.roundYWithDirection(y, d);
            if (!window.$gameMap.isValid(x2, y2)) {
                return false;
            }
            if (!window.$gameMap.isPassable(x2, y2, this.reverseDir(d))) {
                return false;
            }
            if (this.isCollidedWithCharacters(x2, y2)) {
                return false;
            }
        }
        return true;
    }
}
