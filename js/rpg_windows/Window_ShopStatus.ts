import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import { RPGArmor } from '../rpg_data/armor';
import { RPGItem } from '../rpg_data/item';
import { RPGWeapon } from '../rpg_data/weapon';
import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Base } from './Window_Base';

/**
 * The window for displaying number of items in possession and the actor's
 * equipment on the shop screen.
 */
export class Window_ShopStatus extends Window_Base {
    protected _item: RPGItem | RPGWeapon | RPGArmor = null;
    protected _pageIndex = 0;

    initialize(x: number, y: number, width: number, height: number): void {
        super.initialize(x, y, width, height);
        this.refresh();
    }

    refresh(): void {
        this.contents.clear();
        if (this._item) {
            const x = this.textPadding();
            this.drawPossession(x, 0);
            if (this.isEquipItem()) {
                this.drawEquipInfo(x, this.lineHeight() * 2);
            }
        }
    }

    setItem(item: RPGItem | RPGWeapon | RPGArmor): void {
        this._item = item;
        this.refresh();
    }

    isEquipItem(): boolean {
        return DataManager.isWeapon(this._item) || DataManager.isArmor(this._item);
    }

    drawPossession(x: number, y: number): void {
        const width = this.contents.width - this.textPadding() - x;
        const possessionWidth = this.textWidth('0000');
        this.changeTextColor(this.systemColor());
        this.drawText(TextManager.possession, x, y, width - possessionWidth);
        this.resetTextColor();
        this.drawText(window.$gameParty.numItems(this._item).toFixed(), x, y, width, 'right');
    }

    drawEquipInfo(x: number, y: number): void {
        const members = this.statusMembers();
        for (let i = 0; i < members.length; i++) {
            this.drawActorEquipInfo(x, y + this.lineHeight() * (i * 2.4), members[i]);
        }
    }

    statusMembers(): Game_Actor[] {
        const start = this._pageIndex * this.pageSize();
        const end = start + this.pageSize();
        return window.$gameParty.members().slice(start, end);
    }

    pageSize(): number {
        return 4;
    }

    maxPages(): number {
        return Math.floor((window.$gameParty.size() + this.pageSize() - 1) / this.pageSize());
    }

    drawActorEquipInfo(x: number, y: number, actor: Game_Actor): void {
        const enabled = actor.canEquip(this._item);
        this.changePaintOpacity(enabled);
        this.resetTextColor();
        this.drawText(actor.name(), x, y, 168);
        const item1 = this.currentEquippedItem(actor, (this._item as RPGArmor | RPGWeapon).etypeId);
        if (enabled) {
            this.drawActorParamChange(x, y, actor, item1);
        }
        this.drawItemName(item1, x, y + this.lineHeight());
        this.changePaintOpacity(true);
    }

    drawActorParamChange(x: number, y: number, actor: Game_Actor, item1: RPGArmor | RPGWeapon): void {
        const width = this.contents.width - this.textPadding() - x;
        const paramId = this.paramId();
        const change = (this._item as RPGArmor | RPGWeapon).params[paramId] - (item1 ? item1.params[paramId] : 0);
        this.changeTextColor(this.paramchangeTextColor(change));
        this.drawText((change > 0 ? '+' : '') + change, x, y, width, 'right');
    }

    paramId(): number {
        return DataManager.isWeapon(this._item) ? 2 : 3;
    }

    currentEquippedItem(actor: Game_Actor, etypeId: number): RPGWeapon | RPGArmor {
        const list: (RPGArmor | RPGWeapon)[] = [];
        const equips = actor.equips();
        const slots = actor.equipSlots();
        for (let i = 0; i < slots.length; i++) {
            if (slots[i] === etypeId) {
                list.push(equips[i]);
            }
        }
        const paramId = this.paramId();
        let worstParam = Number.MAX_VALUE;
        let worstItem: RPGArmor | RPGWeapon = null;
        for (let j = 0; j < list.length; j++) {
            if (list[j] && list[j].params[paramId] < worstParam) {
                worstParam = list[j].params[paramId];
                worstItem = list[j];
            }
        }
        return worstItem;
    }

    update(): void {
        super.update();
        this.updatePage();
    }

    updatePage(): void {
        if (this.isPageChangeEnabled() && this.isPageChangeRequested()) {
            this.changePage();
        }
    }

    isPageChangeEnabled(): boolean {
        return this.visible && this.maxPages() >= 2;
    }

    isPageChangeRequested(): boolean {
        if (Input.isTriggered('shift')) {
            return true;
        }
        if (TouchInput.isTriggered() && this.isTouchedInsideFrame()) {
            return true;
        }
        return false;
    }

    isTouchedInsideFrame(): boolean {
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    changePage(): void {
        this._pageIndex = (this._pageIndex + 1) % this.maxPages();
        this.refresh();
        SoundManager.playCursor();
    }
}
