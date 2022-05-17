import { Window_BattleStatus } from './Window_BattleStatus';

/**
 * The window for selecting a target actor on the battle screen.
 */
export class Window_BattleActor extends Window_BattleStatus {
    initialize(x, y) {
        super.initialize();
        this.x = x;
        this.y = y;
        this.openness = 255;
        this.hide();
    }

    show() {
        this.select(0);
        super.show();
    }

    hide() {
        super.hide();
        global.$gameParty.select(null);
    }

    select(index) {
        super.select(index);
        global.$gameParty.select(this.actor());
    }

    actor() {
        return global.$gameParty.members()[this.index()];
    }
}
