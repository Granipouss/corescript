import { Graphics } from '../rpg_core/Graphics';
import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for displaying the status of party members on the battle screen.
 */
export class Window_BattleStatus extends Window_Selectable {
    initialize(_x = 0, _y = 0): void {
        const width = this.windowWidth();
        const height = this.windowHeight();
        const x = Graphics.boxWidth - width;
        const y = Graphics.boxHeight - height;
        super.initialize(x, y, width, height);
        this.refresh();
        this.openness = 0;
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

    maxItems(): number {
        return window.$gameParty.battleMembers().length;
    }

    refresh(): void {
        this.contents.clear();
        this.drawAllItems();
    }

    drawItem(index: number): void {
        const actor = window.$gameParty.battleMembers()[index];
        this.drawBasicArea(this.basicAreaRect(index), actor);
        this.drawGaugeArea(this.gaugeAreaRect(index), actor);
    }

    basicAreaRect(index: number): PIXI.Rectangle {
        const rect = this.itemRectForText(index);
        rect.width -= this.gaugeAreaWidth() + 15;
        return rect;
    }

    gaugeAreaRect(index: number): PIXI.Rectangle {
        const rect = this.itemRectForText(index);
        rect.x += rect.width - this.gaugeAreaWidth();
        rect.width = this.gaugeAreaWidth();
        return rect;
    }

    gaugeAreaWidth(): number {
        return 330;
    }

    drawBasicArea(rect: PIXI.Rectangle, actor: Game_Actor): void {
        this.drawActorName(actor, rect.x + 0, rect.y, 150);
        this.drawActorIcons(actor, rect.x + 156, rect.y, rect.width - 156);
    }

    drawGaugeArea(rect: PIXI.Rectangle, actor: Game_Actor): void {
        if (window.$dataSystem.optDisplayTp) {
            this.drawGaugeAreaWithTp(rect, actor);
        } else {
            this.drawGaugeAreaWithoutTp(rect, actor);
        }
    }

    drawGaugeAreaWithTp(rect: PIXI.Rectangle, actor: Game_Actor): void {
        this.drawActorHp(actor, rect.x + 0, rect.y, 108);
        this.drawActorMp(actor, rect.x + 123, rect.y, 96);
        this.drawActorTp(actor, rect.x + 234, rect.y, 96);
    }

    drawGaugeAreaWithoutTp(rect: PIXI.Rectangle, actor: Game_Actor): void {
        this.drawActorHp(actor, rect.x + 0, rect.y, 201);
        this.drawActorMp(actor, rect.x + 216, rect.y, 114);
    }
}
