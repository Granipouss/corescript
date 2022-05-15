//-----------------------------------------------------------------------------
// Game_Actors
//
// The wrapper class for an actor array.

import { Game_Actor } from './Game_Actor';

export function Game_Actors() {
    this.initialize.apply(this, arguments);
}

Game_Actors.prototype.initialize = function () {
    this._data = [];
};

Game_Actors.prototype.actor = function (actorId) {
    if (global.$dataActors[actorId]) {
        if (!this._data[actorId]) {
            this._data[actorId] = new Game_Actor(actorId);
        }
        return this._data[actorId];
    }
    return null;
};
