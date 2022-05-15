//-----------------------------------------------------------------------------
// Game_Follower
//
// The game object class for a follower. A follower is an allied character,
// other than the front character, displayed in the party.

function Game_Follower() {
    this.initialize.apply(this, arguments);
}

Game_Follower.prototype = Object.create(Game_Character.prototype);
Game_Follower.prototype.constructor = Game_Follower;

Game_Follower.prototype.initialize = function (memberIndex) {
    Game_Character.prototype.initialize.call(this);
    this._memberIndex = memberIndex;
    this.setTransparent(global.$dataSystem.optTransparent);
    this.setThrough(true);
};

Game_Follower.prototype.refresh = function () {
    var characterName = this.isVisible() ? this.actor().characterName() : '';
    var characterIndex = this.isVisible() ? this.actor().characterIndex() : 0;
    this.setImage(characterName, characterIndex);
};

Game_Follower.prototype.actor = function () {
    return global.$gameParty.battleMembers()[this._memberIndex];
};

Game_Follower.prototype.isVisible = function () {
    return this.actor() && global.$gamePlayer.followers().isVisible();
};

Game_Follower.prototype.update = function () {
    Game_Character.prototype.update.call(this);
    this.setMoveSpeed(global.$gamePlayer.realMoveSpeed());
    this.setOpacity(global.$gamePlayer.opacity());
    this.setBlendMode(global.$gamePlayer.blendMode());
    this.setWalkAnime(global.$gamePlayer.hasWalkAnime());
    this.setStepAnime(global.$gamePlayer.hasStepAnime());
    this.setDirectionFix(global.$gamePlayer.isDirectionFixed());
    this.setTransparent(global.$gamePlayer.isTransparent());
};

Game_Follower.prototype.chaseCharacter = function (character) {
    var sx = this.deltaXFrom(character.x);
    var sy = this.deltaYFrom(character.y);
    if (sx !== 0 && sy !== 0) {
        this.moveDiagonally(sx > 0 ? 4 : 6, sy > 0 ? 8 : 2);
    } else if (sx !== 0) {
        this.moveStraight(sx > 0 ? 4 : 6);
    } else if (sy !== 0) {
        this.moveStraight(sy > 0 ? 8 : 2);
    }
    this.setMoveSpeed(global.$gamePlayer.realMoveSpeed());
};
