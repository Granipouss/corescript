import { Graphics } from '../rpg_core/Graphics';
import { RPGItem } from '../rpg_data/item';
import { DataManager } from '../rpg_managers/DataManager';
import { Window_ItemList } from './Window_ItemList';
import { Window_Message } from './Window_Message';

/**
 * The window used for the event command [Select Item].
 */
export class Window_EventItem extends Window_ItemList {
    protected _messageWindow: Window_Message;

    constructor(messageWindow: Window_Message) {
        super();

        this._messageWindow = messageWindow;
    }

    initialize(): void {
        const width = Graphics.boxWidth;
        const height = this.windowHeight();
        super.initialize(0, 0, width, height);
        this.openness = 0;
        this.deactivate();
        this.setHandler('ok', this.onOk.bind(this));
        this.setHandler('cancel', this.onCancel.bind(this));
    }

    windowHeight(): number {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows(): number {
        return 4;
    }

    start(): void {
        this.refresh();
        this.updatePlacement();
        this.select(0);
        this.open();
        this.activate();
    }

    updatePlacement(): void {
        if (this._messageWindow.y >= Graphics.boxHeight / 2) {
            this.y = 0;
        } else {
            this.y = Graphics.boxHeight - this.height;
        }
    }

    includes(item: unknown): boolean {
        const itypeId = window.$gameMessage.itemChoiceItypeId();
        return DataManager.isItem(item) && item.itypeId === itypeId;
    }

    isEnabled(_item: RPGItem): boolean {
        return true;
    }

    onOk(): void {
        const item = this.item();
        const itemId = item ? item.id : 0;
        window.$gameVariables.setValue(window.$gameMessage.itemChoiceVariableId(), itemId);
        this._messageWindow.terminateMessage();
        this.close();
    }

    onCancel(): void {
        window.$gameVariables.setValue(window.$gameMessage.itemChoiceVariableId(), 0);
        this._messageWindow.terminateMessage();
        this.close();
    }
}
