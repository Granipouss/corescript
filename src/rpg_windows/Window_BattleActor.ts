import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_BattleStatus } from './Window_BattleStatus';

/**
 * The window for selecting a target actor on the battle screen.
 */
export class Window_BattleActor extends Window_BattleStatus {
    initialize(x: number, y: number): void {
        super.initialize();
        this.x = x;
        this.y = y;
        this.openness = 255;
        this.hide();
    }

    show(): void {
        this.select(0);
        super.show();
    }

    hide(): void {
        super.hide();
        window.$gameParty.select(null);
    }

    select(index: number): void {
        super.select(index);
        window.$gameParty.select(this.actor());
    }

    actor(): Game_Actor {
        return window.$gameParty.members()[this.index()];
    }
}
