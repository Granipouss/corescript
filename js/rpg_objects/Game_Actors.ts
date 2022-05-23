import { Game_Actor } from './Game_Actor';

/**
 * The wrapper class for an actor array.
 */
export class Game_Actors {
    private _data: Game_Actor[];

    constructor() {
        this._data = [];
    }

    actor(actorId: number): Game_Actor {
        if (window.$dataActors[actorId]) {
            if (!this._data[actorId]) {
                this._data[actorId] = new Game_Actor(actorId);
            }
            return this._data[actorId];
        }
        return null;
    }
}
