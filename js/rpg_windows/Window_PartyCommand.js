import { Graphics } from '../rpg_core/Graphics';
import { BattleManager } from '../rpg_managers/BattleManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Window_Command } from './Window_Command';

/**
 * The window for selecting whether to fight or escape on the battle screen.
 */
export class Window_PartyCommand extends Window_Command {
    initialize() {
        var y = Graphics.boxHeight - this.windowHeight();
        super.initialize(0, y);
        this.openness = 0;
        this.deactivate();
    }

    windowWidth() {
        return 192;
    }

    numVisibleRows() {
        return 4;
    }

    makeCommandList() {
        this.addCommand(TextManager.fight, 'fight');
        this.addCommand(TextManager.escape, 'escape', BattleManager.canEscape());
    }

    setup() {
        this.clearCommandList();
        this.makeCommandList();
        this.refresh();
        this.select(0);
        this.activate();
        this.open();
    }
}
