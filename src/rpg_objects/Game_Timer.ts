import { BattleManager } from '../rpg_managers/BattleManager';

/**
 * The game object class for the timer.
 */
export class Game_Timer {
    private _frames: number;
    private _working: boolean;

    constructor() {
        this._frames = 0;
        this._working = false;
    }

    update(sceneActive = false): void {
        if (sceneActive && this._working && this._frames > 0) {
            this._frames--;
            if (this._frames === 0) {
                this.onExpire();
            }
        }
    }

    start(count: number): void {
        this._frames = count;
        this._working = true;
    }

    stop(): void {
        this._working = false;
    }

    isWorking(): boolean {
        return this._working;
    }

    seconds(): number {
        return Math.floor(this._frames / 60);
    }

    onExpire(): void {
        BattleManager.abort();
    }
}
