import { Game_Actor } from './Game_Actor';
import { Game_Character } from './Game_Character';

/**
 * The game object class for a follower. A follower is an allied character,
 * other than the front character, displayed in the party.
 */
export class Game_Follower extends Game_Character {
    private _memberIndex: number;

    constructor(memberIndex: number) {
        super();
        this._memberIndex = memberIndex;
        this.setTransparent(window.$dataSystem.optTransparent);
        this.setThrough(true);
    }

    refresh(): void {
        const characterName = this.isVisible() ? this.actor().characterName() : '';
        const characterIndex = this.isVisible() ? this.actor().characterIndex() : 0;
        this.setImage(characterName, characterIndex);
    }

    actor(): Game_Actor {
        return window.$gameParty.battleMembers()[this._memberIndex];
    }

    isVisible(): boolean {
        return this.actor() && window.$gamePlayer.followers().isVisible();
    }

    update(): void {
        super.update();
        this.setMoveSpeed(window.$gamePlayer.realMoveSpeed());
        this.setOpacity(window.$gamePlayer.opacity());
        this.setBlendMode(window.$gamePlayer.blendMode());
        this.setWalkAnime(window.$gamePlayer.hasWalkAnime());
        this.setStepAnime(window.$gamePlayer.hasStepAnime());
        this.setDirectionFix(window.$gamePlayer.isDirectionFixed());
        this.setTransparent(window.$gamePlayer.isTransparent());
    }

    chaseCharacter(character: Game_Character): void {
        const sx = this.deltaXFrom(character.x);
        const sy = this.deltaYFrom(character.y);
        if (sx !== 0 && sy !== 0) {
            this.moveDiagonally(sx > 0 ? 4 : 6, sy > 0 ? 8 : 2);
        } else if (sx !== 0) {
            this.moveStraight(sx > 0 ? 4 : 6);
        } else if (sy !== 0) {
            this.moveStraight(sy > 0 ? 8 : 2);
        }
        this.setMoveSpeed(window.$gamePlayer.realMoveSpeed());
    }
}
