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

    static _lastCommandSymbol: string = null;

    static initCommandPosition() {
        this._lastCommandSymbol = null;
    }

    windowWidth(): number {
        return 240;
    }

    numVisibleRows(): number {
        return this.maxItems();
    }

    makeCommandList(): void {
        this.addMainCommands();
        this.addFormationCommand();
        this.addOriginalCommands();
        this.addOptionsCommand();
        this.addSaveCommand();
        this.addGameEndCommand();
    }

    addMainCommands(): void {
        const enabled = this.areMainCommandsEnabled();
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

    addFormationCommand(): void {
        if (this.needsCommand('formation')) {
            const enabled = this.isFormationEnabled();
            this.addCommand(TextManager.formation, 'formation', enabled);
        }
    }

    addOriginalCommands(): void {
        // ...
    }

    addOptionsCommand(): void {
        if (this.needsCommand('options')) {
            const enabled = this.isOptionsEnabled();
            this.addCommand(TextManager.options, 'options', enabled);
        }
    }

    addSaveCommand(): void {
        if (this.needsCommand('save')) {
            const enabled = this.isSaveEnabled();
            this.addCommand(TextManager.save, 'save', enabled);
        }
    }

    addGameEndCommand(): void {
        const enabled = this.isGameEndEnabled();
        this.addCommand(TextManager.gameEnd, 'gameEnd', enabled);
    }

    needsCommand(name: string): unknown {
        const flags = window.$dataSystem.menuCommands;
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

    areMainCommandsEnabled(): boolean {
        return window.$gameParty.exists();
    }

    isFormationEnabled(): boolean {
        return window.$gameParty.size() >= 2 && window.$gameSystem.isFormationEnabled();
    }

    isOptionsEnabled(): boolean {
        return true;
    }

    isSaveEnabled(): boolean {
        return !DataManager.isEventTest() && window.$gameSystem.isSaveEnabled();
    }

    isGameEndEnabled(): boolean {
        return true;
    }

    processOk(): void {
        Window_MenuCommand._lastCommandSymbol = this.currentSymbol();
        super.processOk();
    }

    selectLast(): void {
        this.selectSymbol(Window_MenuCommand._lastCommandSymbol);
    }
}
