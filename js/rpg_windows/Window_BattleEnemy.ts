import { Graphics } from '../rpg_core/Graphics';
import { Game_Enemy } from '../rpg_objects/Game_Enemy';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting a target enemy on the battle screen.
 */
export class Window_BattleEnemy extends Window_Selectable {
    protected _enemies: Game_Enemy[];

    initialize(x, y) {
        this._enemies = [];
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(x, y, width, height);
        this.refresh();
        this.hide();
    }

    windowWidth(): number {
        return Graphics.boxWidth - 192;
    }

    windowHeight(): number {
        return this.fittingHeight(this.numVisibleRows());
    }

    numVisibleRows(): number {
        return 4;
    }

    maxCols(): number {
        return 2;
    }

    maxItems(): number {
        return this._enemies.length;
    }

    enemy(): Game_Enemy {
        return this._enemies[this.index()];
    }

    enemyIndex(): number {
        const enemy = this.enemy();
        return enemy ? enemy.index() : -1;
    }

    drawItem(index: number): void {
        this.resetTextColor();
        const name = this._enemies[index].name();
        const rect = this.itemRectForText(index);
        this.drawText(name, rect.x, rect.y, rect.width);
    }

    show(): void {
        this.refresh();
        this.select(0);
        super.show();
    }

    hide(): void {
        super.hide();
        window.$gameTroop.select(null);
    }

    refresh(): void {
        this._enemies = window.$gameTroop.aliveMembers();
        super.refresh();
    }

    select(index: number): void {
        super.select(index);
        window.$gameTroop.select(this.enemy());
    }
}
