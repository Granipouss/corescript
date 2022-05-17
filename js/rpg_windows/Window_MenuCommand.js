import { DataManager } from '../rpg_managers/DataManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Window_Command } from './Window_Command';

/**
 * The window for selecting a command on the menu screen.
 */
export class Window_MenuCommand extends Window_Command {
    initialize(x, y) {
        super.initialize(x, y);
        this.selectLast();
    }

    static _lastCommandSymbol = null;

    static initCommandPosition() {
        this._lastCommandSymbol = null;
    }

    windowWidth() {
        return 240;
    }

    numVisibleRows() {
        return this.maxItems();
    }

    makeCommandList() {
        this.addMainCommands();
        this.addFormationCommand();
        this.addOriginalCommands();
        this.addOptionsCommand();
        this.addSaveCommand();
        this.addGameEndCommand();
    }

    addMainCommands() {
        var enabled = this.areMainCommandsEnabled();
        if (this.needsCommand('item')) {
            this.addCommand(TextManager.item, 'item', enabled);
        }
        if (this.needsCommand('skill')) {
            this.addCommand(TextManager.skill, 'skill', enabled);
        }
        if (this.needsCommand('equip')) {
            this.addCommand(TextManager.equip, 'equip', enabled);
        }
        if (this.needsCommand('status')) {
            this.addCommand(TextManager.status, 'status', enabled);
        }
    }

    addFormationCommand() {
        if (this.needsCommand('formation')) {
            var enabled = this.isFormationEnabled();
            this.addCommand(TextManager.formation, 'formation', enabled);
        }
    }

    addOriginalCommands() {}

    addOptionsCommand() {
        if (this.needsCommand('options')) {
            var enabled = this.isOptionsEnabled();
            this.addCommand(TextManager.options, 'options', enabled);
        }
    }

    addSaveCommand() {
        if (this.needsCommand('save')) {
            var enabled = this.isSaveEnabled();
            this.addCommand(TextManager.save, 'save', enabled);
        }
    }

    addGameEndCommand() {
        var enabled = this.isGameEndEnabled();
        this.addCommand(TextManager.gameEnd, 'gameEnd', enabled);
    }

    needsCommand(name) {
        var flags = global.$dataSystem.menuCommands;
        if (flags) {
            switch (name) {
                case 'item':
                    return flags[0];
                case 'skill':
                    return flags[1];
                case 'equip':
                    return flags[2];
                case 'status':
                    return flags[3];
                case 'formation':
                    return flags[4];
                case 'save':
                    return flags[5];
            }
        }
        return true;
    }

    areMainCommandsEnabled() {
        return global.$gameParty.exists();
    }

    isFormationEnabled() {
        return global.$gameParty.size() >= 2 && global.$gameSystem.isFormationEnabled();
    }

    isOptionsEnabled() {
        return true;
    }

    isSaveEnabled() {
        return !DataManager.isEventTest() && global.$gameSystem.isSaveEnabled();
    }

    isGameEndEnabled() {
        return true;
    }

    processOk() {
        Window_MenuCommand._lastCommandSymbol = this.currentSymbol();
        super.processOk();
    }

    selectLast() {
        this.selectSymbol(Window_MenuCommand._lastCommandSymbol);
    }
}
