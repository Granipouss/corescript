import { DataManager } from '../rpg_managers/DataManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting a save file on the save and load screens.
 */
export class Window_SavefileList extends Window_Selectable {
    initialize(x, y, width, height) {
        super.initialize(x, y, width, height);
        this.activate();
        this._mode = null;
    }

    setMode(mode) {
        this._mode = mode;
    }

    maxItems() {
        return DataManager.maxSavefiles();
    }

    maxVisibleItems() {
        return 5;
    }

    itemHeight() {
        const innerHeight = this.height - this.padding * 2;
        return Math.floor(innerHeight / this.maxVisibleItems());
    }

    drawItem(index) {
        const id = index + 1;
        const valid = DataManager.isThisGameFile(id);
        const info = DataManager.loadSavefileInfo(id);
        const rect = this.itemRectForText(index);
        this.resetTextColor();
        if (this._mode === 'load') {
            this.changePaintOpacity(valid);
        }
        this.drawFileId(id, rect.x, rect.y);
        if (info) {
            this.changePaintOpacity(valid);
            this.drawContents(info, rect, valid);
            this.changePaintOpacity(true);
        }
    }

    drawFileId(id, x, y) {
        if (DataManager.isAutoSaveFileId(id)) {
            if (this._mode === 'save') {
                this.changePaintOpacity(false);
            }
            this.drawText(TextManager.file + ' ' + id + '(Auto)', x, y, 180);
        } else {
            this.drawText(TextManager.file + ' ' + id, x, y, 180);
        }
    }

    drawContents(info, rect, valid) {
        const bottom = rect.y + rect.height;
        if (rect.width >= 420) {
            this.drawGameTitle(info, rect.x + 192, rect.y, rect.width - 192);
            if (valid) {
                this.drawPartyCharacters(info, rect.x + 220, bottom - 4);
            }
        }
        const lineHeight = this.lineHeight();
        const y2 = bottom - lineHeight;
        if (y2 >= lineHeight) {
            this.drawPlaytime(info, rect.x, y2, rect.width);
        }
    }

    drawGameTitle(info, x, y, width) {
        if (info.title) {
            this.drawText(info.title, x, y, width);
        }
    }

    drawPartyCharacters(info, x, y) {
        if (info.characters) {
            for (let i = 0; i < info.characters.length; i++) {
                const data = info.characters[i];
                this.drawCharacter(data[0], data[1], x + i * 48, y);
            }
        }
    }

    drawPlaytime(info, x, y, width) {
        if (info.playtime) {
            this.drawText(info.playtime, x, y, width, 'right');
        }
    }

    playOkSound() {}
}
