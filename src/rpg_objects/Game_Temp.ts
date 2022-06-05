import { Utils } from '../rpg_core/Utils';
import type { RPGCommonEvent } from '../rpg_data/common-event';

/**
 * The game object class for temporary data that is not included in save data.
 */
export class Game_Temp {
    private _isPlaytest: boolean;
    private _commonEventId: number;
    private _destinationX: number;
    private _destinationY: number;

    constructor() {
        this._isPlaytest = Utils.isOptionValid('test');
        this._commonEventId = 0;
        this._destinationX = null;
        this._destinationY = null;
    }

    isPlaytest(): boolean {
        return this._isPlaytest;
    }

    reserveCommonEvent(commonEventId: number): void {
        this._commonEventId = commonEventId;
    }

    clearCommonEvent(): void {
        this._commonEventId = 0;
    }

    isCommonEventReserved(): boolean {
        return this._commonEventId > 0;
    }

    reservedCommonEvent(): RPGCommonEvent {
        return window.$dataCommonEvents[this._commonEventId];
    }

    reservedCommonEventId(): number {
        return this._commonEventId;
    }

    setDestination(x: number, y: number): void {
        this._destinationX = x;
        this._destinationY = y;
    }

    clearDestination(): void {
        this._destinationX = null;
        this._destinationY = null;
    }

    isDestinationValid(): boolean {
        return this._destinationX !== null;
    }

    destinationX(): number {
        return this._destinationX;
    }

    destinationY(): number {
        return this._destinationY;
    }
}
