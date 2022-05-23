import { clamp, format } from '../rpg_core/extension';
import type { RPGArmor } from '../rpg_data/armor';
import type { RPGItem } from '../rpg_data/item';
import type { Game_Actor } from './Game_Actor';
import type { RPGWeapon } from '../rpg_data/weapon';
import { DataManager } from '../rpg_managers/DataManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Game_Item } from './Game_Item';
import { Game_Unit } from './Game_Unit';

/**
 * The game object class for the party. Information such as gold and items is
 * included.
 */
export class Game_Party extends Game_Unit<Game_Actor> {
    static ABILITY_ENCOUNTER_HALF = 0;
    static ABILITY_ENCOUNTER_NONE = 1;
    static ABILITY_CANCEL_SURPRISE = 2;
    static ABILITY_RAISE_PREEMPTIVE = 3;
    static ABILITY_GOLD_DOUBLE = 4;
    static ABILITY_DROP_ITEM_DOUBLE = 5;

    private _gold: number;
    private _steps: number;
    private _lastItem: Game_Item;
    private _menuActorId: number;
    private _targetActorId: number;
    private _actors: number[];
    private _items: Record<number, number>;
    private _weapons: Record<number, number>;
    private _armors: Record<number, number>;

    constructor() {
        super();
        this._gold = 0;
        this._steps = 0;
        this._lastItem = new Game_Item();
        this._menuActorId = 0;
        this._targetActorId = 0;
        this._actors = [];
        this.initAllItems();
    }

    initAllItems(): void {
        this._items = {};
        this._weapons = {};
        this._armors = {};
    }

    exists(): boolean {
        return this._actors.length > 0;
    }

    size(): number {
        return this.members().length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    members(): Game_Actor[] {
        return this.inBattle() ? this.battleMembers() : this.allMembers();
    }

    allMembers(): Game_Actor[] {
        return this._actors.map((id) => window.$gameActors.actor(id));
    }

    battleMembers(): Game_Actor[] {
        return this.allMembers()
            .slice(0, this.maxBattleMembers())
            .filter((actor) => actor.isAppeared());
    }

    maxBattleMembers(): number {
        return 4;
    }

    leader(): Game_Actor {
        return this.battleMembers()[0];
    }

    reviveBattleMembers(): void {
        this.battleMembers().forEach((actor) => {
            if (actor.isDead()) {
                actor.setHp(1);
            }
        });
    }

    items(): RPGItem[] {
        const list = [];
        for (const id in this._items) {
            list.push(window.$dataItems[id]);
        }
        return list;
    }

    weapons(): RPGWeapon[] {
        const list = [];
        for (const id in this._weapons) {
            list.push(window.$dataWeapons[id]);
        }
        return list;
    }

    armors(): RPGArmor[] {
        const list = [];
        for (const id in this._armors) {
            list.push(window.$dataArmors[id]);
        }
        return list;
    }

    equipItems(): (RPGWeapon | RPGArmor)[] {
        return [...this.weapons(), ...this.armors()];
    }

    allItems(): (RPGItem | RPGWeapon | RPGArmor)[] {
        return [...this.items(), ...this.equipItems()];
    }

    itemContainer(item: RPGItem | RPGArmor | RPGWeapon): Record<number, number> {
        if (!item) {
            return null;
        } else if (DataManager.isItem(item)) {
            return this._items;
        } else if (DataManager.isWeapon(item)) {
            return this._weapons;
        } else if (DataManager.isArmor(item)) {
            return this._armors;
        } else {
            return null;
        }
    }

    setupStartingMembers(): void {
        this._actors = [];
        window.$dataSystem.partyMembers.forEach((actorId) => {
            if (window.$gameActors.actor(actorId)) {
                this._actors.push(actorId);
            }
        });
    }

    name(): string {
        const numBattleMembers = this.battleMembers().length;
        if (numBattleMembers === 0) {
            return '';
        } else if (numBattleMembers === 1) {
            return this.leader().name();
        } else {
            return format(TextManager.partyName, this.leader().name());
        }
    }

    setupBattleTest(): void {
        this.setupBattleTestMembers();
        this.setupBattleTestItems();
    }

    setupBattleTestMembers(): void {
        window.$dataSystem.testBattlers.forEach((battler) => {
            const actor = window.$gameActors.actor(battler.actorId);
            if (actor) {
                actor.changeLevel(battler.level, false);
                actor.initEquips(battler.equips);
                actor.recoverAll();
                this.addActor(battler.actorId);
            }
        });
    }

    setupBattleTestItems(): void {
        window.$dataItems.forEach((item) => {
            if (item && item.name.length > 0) {
                this.gainItem(item, this.maxItems(item));
            }
        });
    }

    highestLevel(): number {
        return Math.max(...this.members().map((actor) => actor.level));
    }

    addActor(actorId: number): void {
        if (!this._actors.includes(actorId)) {
            this._actors.push(actorId);
            window.$gamePlayer.refresh();
            window.$gameMap.requestRefresh();
        }
    }

    removeActor(actorId: number): void {
        if (this._actors.includes(actorId)) {
            this._actors.splice(this._actors.indexOf(actorId), 1);
            window.$gamePlayer.refresh();
            window.$gameMap.requestRefresh();
        }
    }

    gold(): number {
        return this._gold;
    }

    gainGold(amount: number): void {
        this._gold = clamp(this._gold + amount, [0, this.maxGold()]);
    }

    loseGold(amount: number): void {
        this.gainGold(-amount);
    }

    maxGold(): number {
        return 99999999;
    }

    steps(): number {
        return this._steps;
    }

    increaseSteps(): void {
        this._steps++;
    }

    numItems(item: RPGItem | RPGArmor | RPGWeapon): number {
        const container = this.itemContainer(item);
        return container ? container[item.id] || 0 : 0;
    }

    maxItems(_item: RPGItem | RPGArmor | RPGWeapon): number {
        return 99;
    }

    hasMaxItems(item: RPGItem | RPGArmor | RPGWeapon): boolean {
        return this.numItems(item) >= this.maxItems(item);
    }

    hasItem(item: RPGItem | RPGArmor | RPGWeapon, includeEquip = false): boolean {
        if (this.numItems(item) > 0) {
            return true;
        } else if (includeEquip && this.isAnyMemberEquipped(item as RPGArmor | RPGWeapon)) {
            return true;
        } else {
            return false;
        }
    }

    isAnyMemberEquipped(item: RPGArmor | RPGWeapon): boolean {
        return this.members().some((actor) => actor.equips().includes(item));
    }

    gainItem(item: RPGItem | RPGArmor | RPGWeapon, amount: number, includeEquip = false): void {
        const container = this.itemContainer(item);
        if (container) {
            const lastNumber = this.numItems(item);
            const newNumber = lastNumber + amount;
            container[item.id] = clamp(newNumber, [0, this.maxItems(item)]);
            if (container[item.id] === 0) {
                delete container[item.id];
            }
            if (includeEquip && newNumber < 0) {
                this.discardMembersEquip(item as RPGArmor | RPGWeapon, -newNumber);
            }
            window.$gameMap.requestRefresh();
        }
    }

    discardMembersEquip(item: RPGArmor | RPGWeapon, amount: number): void {
        let n = amount;
        this.members().forEach((actor) => {
            while (n > 0 && actor.isEquipped(item)) {
                actor.discardEquip(item);
                n--;
            }
        });
    }

    loseItem(item: RPGItem | RPGArmor | RPGWeapon, amount: number, includeEquip = false): void {
        this.gainItem(item, -amount, includeEquip);
    }

    consumeItem(item: RPGItem): void {
        if (DataManager.isItem(item) && item.consumable) {
            this.loseItem(item, 1);
        }
    }

    canUse(item: RPGItem): boolean {
        return this.members().some((actor) => actor.canUse(item));
    }

    canInput(): boolean {
        return this.members().some((actor) => actor.canInput());
    }

    isAllDead(): boolean {
        if (super.isAllDead()) {
            return this.inBattle() || !this.isEmpty();
        } else {
            return false;
        }
    }

    onPlayerWalk(): void {
        this.members().forEach((actor) => actor.onPlayerWalk());
    }

    menuActor(): Game_Actor {
        let actor = window.$gameActors.actor(this._menuActorId);
        if (!this.members().includes(actor)) {
            actor = this.members()[0];
        }
        return actor;
    }

    setMenuActor(actor: Game_Actor): void {
        this._menuActorId = actor.actorId();
    }

    makeMenuActorNext(): void {
        let index = this.members().indexOf(this.menuActor());
        if (index >= 0) {
            index = (index + 1) % this.members().length;
            this.setMenuActor(this.members()[index]);
        } else {
            this.setMenuActor(this.members()[0]);
        }
    }

    makeMenuActorPrevious(): void {
        let index = this.members().indexOf(this.menuActor());
        if (index >= 0) {
            index = (index + this.members().length - 1) % this.members().length;
            this.setMenuActor(this.members()[index]);
        } else {
            this.setMenuActor(this.members()[0]);
        }
    }

    targetActor(): Game_Actor {
        let actor = window.$gameActors.actor(this._targetActorId);
        if (!this.members().includes(actor)) {
            actor = this.members()[0];
        }
        return actor;
    }

    setTargetActor(actor: Game_Actor): void {
        this._targetActorId = actor.actorId();
    }

    lastItem(): RPGItem {
        return this._lastItem.object() as RPGItem;
    }

    setLastItem(item: RPGItem): void {
        this._lastItem.setObject(item);
    }

    swapOrder(index1: number, index2: number): void {
        const temp = this._actors[index1];
        this._actors[index1] = this._actors[index2];
        this._actors[index2] = temp;
        window.$gamePlayer.refresh();
    }

    charactersForSavefile(): [string, number][] {
        return this.battleMembers().map((actor) => [actor.characterName(), actor.characterIndex()]);
    }

    facesForSavefile(): [string, number][] {
        return this.battleMembers().map((actor) => [actor.faceName(), actor.faceIndex()]);
    }

    partyAbility(abilityId: number): boolean {
        return this.battleMembers().some((actor) => actor.partyAbility(abilityId));
    }

    hasEncounterHalf(): boolean {
        return this.partyAbility(Game_Party.ABILITY_ENCOUNTER_HALF);
    }

    hasEncounterNone(): boolean {
        return this.partyAbility(Game_Party.ABILITY_ENCOUNTER_NONE);
    }

    hasCancelSurprise(): boolean {
        return this.partyAbility(Game_Party.ABILITY_CANCEL_SURPRISE);
    }

    hasRaisePreemptive(): boolean {
        return this.partyAbility(Game_Party.ABILITY_RAISE_PREEMPTIVE);
    }

    hasGoldDouble(): boolean {
        return this.partyAbility(Game_Party.ABILITY_GOLD_DOUBLE);
    }

    hasDropItemDouble(): boolean {
        return this.partyAbility(Game_Party.ABILITY_DROP_ITEM_DOUBLE);
    }

    ratePreemptive(troopAgi: number): number {
        let rate = this.agility() >= troopAgi ? 0.05 : 0.03;
        if (this.hasRaisePreemptive()) {
            rate *= 4;
        }
        return rate;
    }

    rateSurprise(troopAgi: number): number {
        let rate = this.agility() >= troopAgi ? 0.03 : 0.05;
        if (this.hasCancelSurprise()) {
            rate = 0;
        }
        return rate;
    }

    performVictory(): void {
        this.members().forEach((actor) => {
            actor.performVictory();
        });
    }

    performEscape(): void {
        this.members().forEach((actor) => {
            actor.performEscape();
        });
    }

    removeBattleStates(): void {
        this.members().forEach((actor) => {
            actor.removeBattleStates();
        });
    }

    requestMotionRefresh(): void {
        this.members().forEach((actor) => {
            actor.requestMotionRefresh();
        });
    }
}
