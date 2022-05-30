import { Window_BattleStatus } from './Window_BattleStatus';

/**
 * The window for selecting a target actor on the battle screen.
 */
export class Window_BattleActor extends Window_BattleStatus {
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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
        window.$gameParty.select(null);
    }

    select(index) {
        super.select(index);
        window.$gameParty.select(this.actor());
    }

    actor() {
        return window.$gameParty.members()[this.index()];
    }
}
