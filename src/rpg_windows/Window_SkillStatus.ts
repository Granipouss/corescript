import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying the skill user's status on the skill screen.
 */
export class Window_SkillStatus extends Window_Base {
    protected _actor: Game_Actor = null;

    setActor(actor: Game_Actor): void {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    }

    refresh(): void {
        this.contents.clear();
        if (this._actor) {
            const w = this.width - this.padding * 2;
            const h = this.height - this.padding * 2;
            const y = h / 2 - this.lineHeight() * 1.5;
            const width = w - 162 - this.textPadding();
            this.drawActorFace(this._actor, 0, 0, 144, h);
            this.drawActorSimpleStatus(this._actor, 162, y, width);
        }
    }
}
