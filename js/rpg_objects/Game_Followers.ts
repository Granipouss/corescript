import { Game_Follower } from './Game_Follower';

/**
 * The wrapper class for a follower array.
 */
export class Game_Followers {
    private _visible: boolean;
    private _gathering: boolean;
    private _data: Game_Follower[];

    constructor() {
        this._visible = window.$dataSystem.optFollowers;
        this._gathering = false;
        this._data = [];
        for (let i = 1; i < window.$gameParty.maxBattleMembers(); i++) {
            this._data.push(new Game_Follower(i));
        }
    }

    isVisible(): boolean {
        return this._visible;
    }

    show(): void {
        this._visible = true;
    }

    hide(): void {
        this._visible = false;
    }

    follower(index: number): Game_Follower {
        return this._data[index];
    }

    forEach(callback: (follower: Game_Follower) => void, thisObject?: unknown): void {
        this._data.forEach(callback, thisObject);
    }

    reverseEach(callback: (follower: Game_Follower) => void, thisObject?: unknown): void {
        this._data.reverse();
        this._data.forEach(callback, thisObject);
        this._data.reverse();
    }

    refresh(): void {
        this.forEach((follower) => follower.refresh());
    }

    update(): void {
        if (this.areGathering()) {
            if (!this.areMoving()) {
                this.updateMove();
            }
            if (this.areGathered()) {
                this._gathering = false;
            }
        }
        this.forEach((follower) => {
            follower.update();
        });
    }

    updateMove(): void {
        for (let i = this._data.length - 1; i >= 0; i--) {
            const precedingCharacter = i > 0 ? this._data[i - 1] : window.$gamePlayer;
            this._data[i].chaseCharacter(precedingCharacter);
        }
    }

    jumpAll(): void {
        if (window.$gamePlayer.isJumping()) {
            for (let i = 0; i < this._data.length; i++) {
                const follower = this._data[i];
                const sx = window.$gamePlayer.deltaXFrom(follower.x);
                const sy = window.$gamePlayer.deltaYFrom(follower.y);
                follower.jump(sx, sy);
            }
        }
    }

    synchronize(x: number, y: number, d: number): void {
        this.forEach((follower) => {
            follower.locate(x, y);
            follower.setDirection(d);
        });
    }

    gather(): void {
        this._gathering = true;
    }

    areGathering(): boolean {
        return this._gathering;
    }

    visibleFollowers(): Game_Follower[] {
        return this._data.filter((follower) => follower.isVisible());
    }

    areMoving(): boolean {
        return this.visibleFollowers().some((follower) => follower.isMoving(), this);
    }

    areGathered(): boolean {
        return this.visibleFollowers().every(
            (follower) => !follower.isMoving() && follower.pos(window.$gamePlayer.x, window.$gamePlayer.y),
            this
        );
    }

    isSomeoneCollided(x: number, y: number): boolean {
        return this.visibleFollowers().some((follower) => follower.pos(x, y), this);
    }
}
