import type { RPGSkill } from '../rpg_data/skill';
import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for selecting a skill on the skill screen.
 */
export class Window_SkillList extends Window_Selectable {
    protected _actor: Game_Actor = null;
    protected _stypeId = 0;
    protected _data: RPGSkill[] = [];

    setActor(actor: Game_Actor): void {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
            this.resetScroll();
        }
    }

    setStypeId(stypeId: number): void {
        if (this._stypeId !== stypeId) {
            this._stypeId = stypeId;
            this.refresh();
            this.resetScroll();
        }
    }

    maxCols(): number {
        return 2;
    }

    spacing(): number {
        return 48;
    }

    maxItems(): number {
        return this._data ? this._data.length : 1;
    }

    item(): RPGSkill {
        return this._data && this.index() >= 0 ? this._data[this.index()] : null;
    }

    isCurrentItemEnabled(): boolean {
        return this.isEnabled(this._data[this.index()]);
    }

    includes(item: RPGSkill): boolean {
        return item && item.stypeId === this._stypeId;
    }

    isEnabled(item: RPGSkill): boolean {
        return this._actor && this._actor.canUse(item);
    }

    makeItemList(): void {
        if (this._actor) {
            this._data = this._actor.skills().filter((item) => this.includes(item));
        } else {
            this._data = [];
        }
    }

    selectLast(): void {
        let skill: RPGSkill;
        if (window.$gameParty.inBattle()) {
            skill = this._actor.lastBattleSkill();
        } else {
            skill = this._actor.lastMenuSkill();
        }
        const index = this._data.indexOf(skill);
        this.select(index >= 0 ? index : 0);
    }

    drawItem(index: number): void {
        const skill = this._data[index];
        if (skill) {
            const costWidth = this.costWidth();
            const rect = this.itemRect(index);
            rect.width -= this.textPadding();
            this.changePaintOpacity(this.isEnabled(skill));
            this.drawItemName(skill, rect.x, rect.y, rect.width - costWidth);
            this.drawSkillCost(skill, rect.x, rect.y, rect.width);
            this.changePaintOpacity(true);
        }
    }

    costWidth(): number {
        return this.textWidth('000');
    }

    drawSkillCost(skill: RPGSkill, x: number, y: number, width: number): void {
        if (this._actor.skillTpCost(skill) > 0) {
            this.changeTextColor(this.tpCostColor());
            this.drawText(this._actor.skillTpCost(skill).toFixed(), x, y, width, 'right');
        } else if (this._actor.skillMpCost(skill) > 0) {
            this.changeTextColor(this.mpCostColor());
            this.drawText(this._actor.skillMpCost(skill).toFixed(), x, y, width, 'right');
        }
    }

    updateHelp(): void {
        this.setHelpWindowItem(this.item());
    }

    refresh(): void {
        this.makeItemList();
        this.createContents();
        this.drawAllItems();
    }
}
