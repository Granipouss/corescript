import { Graphics } from '../rpg_core/Graphics';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting a target enemy on the battle screen.
 */
export class Window_BattleEnemy extends Window_Selectable {
    initialize(x, y) {
        this._enemies = [];
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.hide();
    }

    windowWidth() {
        return Graphics.boxWidth - 192;
    }

    windowHeight() {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows() {
        return 4;
    }

    maxCols() {
        return 2;
    }

    maxItems() {
        return this._enemies.length;
    }

    enemy() {
        return this._enemies[this.index()];
    }

    enemyIndex() {
        const enemy = this.enemy();
        return enemy ? enemy.index() : -1;
    }

    drawItem(index) {
        this.resetTextColor();
        const name = this._enemies[index].name();
        const rect = this.itemRectForText(index);
        this.drawText(name, rect.x, rect.y, rect.width);
    }

    show() {
        this.refresh();
        this.select(0);
        super.show();
    }

    hide() {
        super.hide();
        global.$gameTroop.select(null);
    }

    refresh() {
        this._enemies = global.$gameTroop.aliveMembers();
        super.refresh();
    }

    select(index) {
        super.select(index);
        global.$gameTroop.select(this.enemy());
    }
}
