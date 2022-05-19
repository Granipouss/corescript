import { Window_Base } from './Window_Base';

/**
 * The window for displaying the skill user's status on the skill screen.
 */
export class Window_SkillStatus extends Window_Base {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this._actor = null;
    }

    setActor(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    }

    refresh() {
        this.contents.clear();
        if (this._actor) {
            const w = this.width - this.padding * 2;
            const h = this.height - this.padding * 2;
            const y = h / 2 - this.lineHeight() * 1.5;
            var width = w - 162 - this.textPadding();
            this.drawActorFace(this._actor, 0, 0, 144, h);
            this.drawActorSimpleStatus(this._actor, 162, y, width);
        }
    }
}
