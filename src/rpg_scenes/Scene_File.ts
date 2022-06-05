import { Graphics } from '../rpg_core/Graphics';
import { DataManager } from '../rpg_managers/DataManager';
import { Window_Help } from '../rpg_windows/Window_Help';
import { Window_SavefileList } from '../rpg_windows/Window_SavefileList';
import { Scene_MenuBase } from './Scene_MenuBase';

/**
 * The superclass of Scene_Save and Scene_Load.
 */
export class Scene_File extends Scene_MenuBase {
    protected _listWindow: Window_SavefileList;

    create(): void {
        super.create();
        DataManager.loadAllSavefileImages();
        this.createHelpWindow();
        this.createListWindow();
    }

    start(): void {
        super.start();
        this._listWindow.refresh();
    }

    savefileId(): number {
        return this._listWindow.index() + 1;
    }

    createHelpWindow(): void {
        this._helpWindow = new Window_Help(1);
        this.addWindow(this._helpWindow);
        this._helpWindow.setText(this.helpWindowText());
    }

    createListWindow(): void {
        const x = 0;
        const y = this._helpWindow.height;
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight - y;
        this._listWindow = new Window_SavefileList(x, y, width, height);
        this._listWindow.setHandler('ok', this.onSavefileOk.bind(this));
        this._listWindow.setHandler('cancel', this.popScene.bind(this));
        this._listWindow.select(this.firstSavefileIndex());
        this._listWindow.setTopRow(this.firstSavefileIndex() - 2);
        this._listWindow.setMode(this.mode());
        this.addWindow(this._listWindow);
        this._listWindow.refresh();
    }

    mode(): 'save' | 'load' {
        return null;
    }

    activateListWindow(): void {
        this._listWindow.activate();
    }

    helpWindowText(): string {
        return '';
    }

    firstSavefileIndex(): number {
        return 0;
    }

    onSavefileOk(): void {
        // ...
    }
}
