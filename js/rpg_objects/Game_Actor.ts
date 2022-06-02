import { clamp, format } from '../rpg_core/extension';
import { RPGActor } from '../rpg_data/actor';
import { RPGArmor } from '../rpg_data/armor';
import { RPGClass } from '../rpg_data/class';
import { RPGItem } from '../rpg_data/item';
import { RPGSkill } from '../rpg_data/skill';
import { RPGState } from '../rpg_data/state';
import { RPGTraitObject } from '../rpg_data/trait';
import { RPGWeapon } from '../rpg_data/weapon';
import { BattleManager } from '../rpg_managers/BattleManager';
import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Game_Action } from './Game_Action';
import { Game_Battler } from './Game_Battler';
import { Game_Item } from './Game_Item';
import { Game_Party } from './Game_Party';
import { Game_Troop } from './Game_Troop';

/**
 * The game object class for an actor.
 */
export class Game_Actor extends Game_Battler {
    private _level: number;
    private _actorId: number;
    private _name: string;
    private _nickname: string;
    private _classId: number;
    private _characterName: string;
    private _characterIndex: number;
    private _faceName: string;
    private _faceIndex: number;
    private _battlerName: string;
    private _exp: Record<number, number>;
    private _skills: number[];
    private _equips: Game_Item[];
    private _actionInputIndex: number;
    private _lastMenuSkill: Game_Item;
    private _lastBattleSkill: Game_Item;
    private _lastCommandSymbol: string;
    private _profile: string;
    private _stateSteps: Record<number, number>;

    get level(): number {
        return this._level;
    }

    constructor(actorId: number) {
        super();
        this.setup(actorId);
    }

    initMembers(): void {
        super.initMembers();
        this._actorId = 0;
        this._name = '';
        this._nickname = '';
        this._classId = 0;
        this._level = 0;
        this._characterName = '';
        this._characterIndex = 0;
        this._faceName = '';
        this._faceIndex = 0;
        this._battlerName = '';
        this._exp = {};
        this._skills = [];
        this._equips = [];
        this._actionInputIndex = 0;
        this._lastMenuSkill = new Game_Item();
        this._lastBattleSkill = new Game_Item();
        this._lastCommandSymbol = '';
    }

    setup(actorId: number): void {
        const actor = window.$dataActors[actorId];
        this._actorId = actorId;
        this._name = actor.name;
        this._nickname = actor.nickname;
        this._profile = actor.profile;
        this._classId = actor.classId;
        this._level = actor.initialLevel;
        this.initImages();
        this.initExp();
        this.initSkills();
        this.initEquips(actor.equips);
        this.clearParamPlus();
        this.recoverAll();
    }

    actorId(): number {
        return this._actorId;
    }

    actor(): RPGActor {
        return window.$dataActors[this._actorId];
    }

    name(): string {
        return this._name;
    }

    setName(name: string): void {
        this._name = name;
    }

    nickname(): string {
        return this._nickname;
    }

    setNickname(nickname: string): void {
        this._nickname = nickname;
    }

    profile(): string {
        return this._profile;
    }

    setProfile(profile: string): void {
        this._profile = profile;
    }

    characterName(): string {
        return this._characterName;
    }

    characterIndex(): number {
        return this._characterIndex;
    }

    faceName(): string {
        return this._faceName;
    }

    faceIndex(): number {
        return this._faceIndex;
    }

    battlerName(): string {
        return this._battlerName;
    }

    clearStates(): void {
        super.clearStates();
        this._stateSteps = {};
    }

    eraseState(stateId: number): void {
        super.eraseState(stateId);
        delete this._stateSteps[stateId];
    }

    resetStateCounts(stateId: number): void {
        super.resetStateCounts(stateId);
        this._stateSteps[stateId] = window.$dataStates[stateId].stepsToRemove;
    }

    initImages(): void {
        const actor = this.actor();
        this._characterName = actor.characterName;
        this._characterIndex = actor.characterIndex;
        this._faceName = actor.faceName;
        this._faceIndex = actor.faceIndex;
        this._battlerName = actor.battlerName;
    }

    expForLevel(level: number): number {
        const c = this.currentClass();
        const basis = c.expParams[0];
        const extra = c.expParams[1];
        const acc_a = c.expParams[2];
        const acc_b = c.expParams[3];
        return Math.round(
            (basis * Math.pow(level - 1, 0.9 + acc_a / 250) * level * (level + 1)) /
                (6 + Math.pow(level, 2) / 50 / acc_b) +
                (level - 1) * extra
        );
    }

    initExp(): void {
        this._exp[this._classId] = this.currentLevelExp();
    }

    currentExp(): number {
        return this._exp[this._classId];
    }

    currentLevelExp(): number {
        return this.expForLevel(this._level);
    }

    nextLevelExp(): number {
        return this.expForLevel(this._level + 1);
    }

    nextRequiredExp(): number {
        return this.nextLevelExp() - this.currentExp();
    }

    maxLevel(): number {
        return this.actor().maxLevel;
    }

    isMaxLevel(): boolean {
        return this._level >= this.maxLevel();
    }

    initSkills(): void {
        this._skills = [];
        this.currentClass().learnings.forEach((learning) => {
            if (learning.level <= this._level) {
                this.learnSkill(learning.skillId);
            }
        });
    }

    initEquips(equips: readonly number[]): void {
        const slots = this.equipSlots();
        const maxSlots = slots.length;
        this._equips = [];
        for (let i = 0; i < maxSlots; i++) {
            this._equips[i] = new Game_Item();
        }
        for (let j = 0; j < equips.length; j++) {
            if (j < maxSlots) {
                this._equips[j].setEquip(slots[j] === 1, equips[j]);
            }
        }
        this.releaseUnequippableItems(true);
        this.refresh();
    }

    equipSlots(): number[] {
        const slots = [];
        for (let i = 1; i < window.$dataSystem.equipTypes.length; i++) {
            slots.push(i);
        }
        if (slots.length >= 2 && this.isDualWield()) {
            slots[1] = 1;
        }
        return slots;
    }

    equips(): (RPGArmor | RPGWeapon)[] {
        return this._equips.map((item) => item.object() as RPGArmor | RPGWeapon);
    }

    weapons(): RPGWeapon[] {
        return this.equips().filter((item): item is RPGWeapon => item && DataManager.isWeapon(item));
    }

    armors(): RPGArmor[] {
        return this.equips().filter((item): item is RPGArmor => item && DataManager.isArmor(item));
    }

    hasWeapon(weapon: RPGWeapon): boolean {
        return this.weapons().includes(weapon);
    }

    hasArmor(armor: RPGArmor): boolean {
        return this.armors().includes(armor);
    }

    isEquipChangeOk(slotId: number): boolean {
        return !this.isEquipTypeLocked(this.equipSlots()[slotId]) && !this.isEquipTypeSealed(this.equipSlots()[slotId]);
    }

    changeEquip(slotId: number, item: RPGArmor | RPGWeapon): void {
        if (
            this.tradeItemWithParty(item, this.equips()[slotId]) &&
            (!item || this.equipSlots()[slotId] === item.etypeId)
        ) {
            this._equips[slotId].setObject(item);
            this.refresh();
        }
    }

    forceChangeEquip(slotId: number, item: RPGArmor | RPGWeapon): void {
        this._equips[slotId].setObject(item);
        this.releaseUnequippableItems(true);
        this.refresh();
    }

    tradeItemWithParty(newItem: RPGArmor | RPGWeapon | RPGItem, oldItem: RPGArmor | RPGWeapon | RPGItem): boolean {
        if (newItem && !window.$gameParty.hasItem(newItem)) {
            return false;
        } else {
            window.$gameParty.gainItem(oldItem, 1);
            window.$gameParty.loseItem(newItem, 1);
            return true;
        }
    }

    changeEquipById(etypeId: number, itemId: number): void {
        const slotId = etypeId - 1;
        if (this.equipSlots()[slotId] === 1) {
            this.changeEquip(slotId, window.$dataWeapons[itemId]);
        } else {
            this.changeEquip(slotId, window.$dataArmors[itemId]);
        }
    }

    isEquipped(item: RPGArmor | RPGWeapon): boolean {
        return this.equips().includes(item);
    }

    discardEquip(item: RPGArmor | RPGWeapon): void {
        const slotId = this.equips().indexOf(item);
        if (slotId >= 0) {
            this._equips[slotId].setObject(null);
        }
    }

    releaseUnequippableItems(forcing = false): void {
        for (;;) {
            const slots = this.equipSlots();
            const equips = this.equips();
            let changed = false;
            for (let i = 0; i < equips.length; i++) {
                const item = equips[i];
                if (item && (!this.canEquip(item) || item.etypeId !== slots[i])) {
                    if (!forcing) {
                        this.tradeItemWithParty(null, item);
                    }
                    this._equips[i].setObject(null);
                    changed = true;
                }
            }
            if (!changed) {
                break;
            }
        }
    }

    clearEquipments(): void {
        const maxSlots = this.equipSlots().length;
        for (let i = 0; i < maxSlots; i++) {
            if (this.isEquipChangeOk(i)) {
                this.changeEquip(i, null);
            }
        }
    }

    optimizeEquipments(): void {
        const maxSlots = this.equipSlots().length;
        this.clearEquipments();
        for (let i = 0; i < maxSlots; i++) {
            if (this.isEquipChangeOk(i)) {
                this.changeEquip(i, this.bestEquipItem(i));
            }
        }
    }

    bestEquipItem(slotId: number): RPGArmor | RPGWeapon {
        const etypeId = this.equipSlots()[slotId];
        const items = window.$gameParty.equipItems().filter((item) => {
            return item.etypeId === etypeId && this.canEquip(item);
        });
        let bestItem = null;
        let bestPerformance = -1000;
        for (let i = 0; i < items.length; i++) {
            const performance = this.calcEquipItemPerformance(items[i]);
            if (performance > bestPerformance) {
                bestPerformance = performance;
                bestItem = items[i];
            }
        }
        return bestItem;
    }

    calcEquipItemPerformance(item: RPGArmor | RPGWeapon): number {
        return item.params.reduce((a, b) => a + b);
    }

    isSkillWtypeOk(skill: RPGSkill): boolean {
        const wtypeId1 = skill.requiredWtypeId1;
        const wtypeId2 = skill.requiredWtypeId2;
        if (
            (wtypeId1 === 0 && wtypeId2 === 0) ||
            (wtypeId1 > 0 && this.isWtypeEquipped(wtypeId1)) ||
            (wtypeId2 > 0 && this.isWtypeEquipped(wtypeId2))
        ) {
            return true;
        } else {
            return false;
        }
    }

    isWtypeEquipped(wtypeId: number): boolean {
        return this.weapons().some((weapon) => weapon.wtypeId === wtypeId);
    }

    refresh(): void {
        this.releaseUnequippableItems(false);
        super.refresh();
    }

    isActor(): boolean {
        return true;
    }

    friendsUnit(): Game_Party {
        return window.$gameParty;
    }

    opponentsUnit(): Game_Troop {
        return window.$gameTroop;
    }

    index(): number {
        return window.$gameParty.members().indexOf(this);
    }

    isBattleMember(): boolean {
        return window.$gameParty.battleMembers().includes(this);
    }

    isFormationChangeOk(): boolean {
        return true;
    }

    currentClass(): RPGClass {
        return window.$dataClasses[this._classId];
    }

    isClass(gameClass: RPGClass): boolean {
        return gameClass && this._classId === gameClass.id;
    }

    skills(): RPGSkill[] {
        const list: RPGSkill[] = [];
        this._skills.concat(this.addedSkills()).forEach((id) => {
            if (!list.includes(window.$dataSkills[id])) {
                list.push(window.$dataSkills[id]);
            }
        });
        return list;
    }

    usableSkills(): RPGSkill[] {
        return this.skills().filter((skill) => {
            return this.canUse(skill);
        });
    }

    traitObjects(): RPGTraitObject[] {
        let objects = super.traitObjects();
        objects = objects.concat([this.actor(), this.currentClass()]);
        const equips = this.equips();
        for (let i = 0; i < equips.length; i++) {
            const item = equips[i];
            if (item) {
                objects.push(item);
            }
        }
        return objects;
    }

    attackElements(): number[] {
        const set = super.attackElements();
        if (this.hasNoWeapons() && !set.includes(this.bareHandsElementId())) {
            set.push(this.bareHandsElementId());
        }
        return set;
    }

    hasNoWeapons(): boolean {
        return this.weapons().length === 0;
    }

    bareHandsElementId(): number {
        return 1;
    }

    paramMax(paramId: number): number {
        if (paramId === 0) {
            return 9999; // MHP
        }
        return super.paramMax(paramId);
    }

    paramBase(paramId: number): number {
        return this.currentClass().params[paramId][this._level];
    }

    paramPlus(paramId: number): number {
        let value = super.paramPlus(paramId);
        const equips = this.equips();
        for (let i = 0; i < equips.length; i++) {
            const item = equips[i];
            if (item) {
                value += item.params[paramId];
            }
        }
        return value;
    }

    attackAnimationId1(): number {
        if (this.hasNoWeapons()) {
            return this.bareHandsAnimationId();
        } else {
            const weapons = this.weapons();
            return weapons[0] ? weapons[0].animationId : 0;
        }
    }

    attackAnimationId2(): number {
        const weapons = this.weapons();
        return weapons[1] ? weapons[1].animationId : 0;
    }

    bareHandsAnimationId(): number {
        return 1;
    }

    changeExp(exp: number, show: boolean): void {
        this._exp[this._classId] = Math.max(exp, 0);
        const lastLevel = this._level;
        const lastSkills = this.skills();
        while (!this.isMaxLevel() && this.currentExp() >= this.nextLevelExp()) {
            this.levelUp();
        }
        while (this.currentExp() < this.currentLevelExp()) {
            this.levelDown();
        }
        if (show && this._level > lastLevel) {
            this.displayLevelUp(this.findNewSkills(lastSkills));
        }
        this.refresh();
    }

    levelUp(): void {
        this._level++;
        this.currentClass().learnings.forEach((learning) => {
            if (learning.level === this._level) {
                this.learnSkill(learning.skillId);
            }
        });
    }

    levelDown(): void {
        this._level--;
    }

    findNewSkills(lastSkills: RPGSkill[]): RPGSkill[] {
        const newSkills = this.skills();
        for (let i = 0; i < lastSkills.length; i++) {
            const index = newSkills.indexOf(lastSkills[i]);
            if (index >= 0) {
                newSkills.splice(index, 1);
            }
        }
        return newSkills;
    }

    displayLevelUp(newSkills: RPGSkill[]): void {
        const text = format(TextManager.levelUp, this._name, TextManager.level, this._level);
        window.$gameMessage.newPage();
        window.$gameMessage.add(text);
        newSkills.forEach((skill) => {
            window.$gameMessage.add(format(TextManager.obtainSkill, skill.name));
        });
    }

    gainExp(exp: number): void {
        const newExp = this.currentExp() + Math.round(exp * this.finalExpRate());
        this.changeExp(newExp, this.shouldDisplayLevelUp());
    }

    finalExpRate(): number {
        return this.exr * (this.isBattleMember() ? 1 : this.benchMembersExpRate());
    }

    benchMembersExpRate(): number {
        return window.$dataSystem.optExtraExp ? 1 : 0;
    }

    shouldDisplayLevelUp(): boolean {
        return true;
    }

    changeLevel(level: number, show: boolean): void {
        level = clamp(level, [1, this.maxLevel()]);
        this.changeExp(this.expForLevel(level), show);
    }

    learnSkill(skillId: number): void {
        if (!this.isLearnedSkill(skillId)) {
            this._skills.push(skillId);
            this._skills.sort((a, b) => a - b);
        }
    }

    forgetSkill(skillId: number): void {
        const index = this._skills.indexOf(skillId);
        if (index >= 0) {
            this._skills.splice(index, 1);
        }
    }

    isLearnedSkill(skillId: number): boolean {
        return this._skills.includes(skillId);
    }

    hasSkill(skillId: number): boolean {
        return this.skills().includes(window.$dataSkills[skillId]);
    }

    changeClass(classId: number, keepExp = false): void {
        if (keepExp) {
            this._exp[classId] = this.currentExp();
        }
        this._classId = classId;
        this.changeExp(this._exp[this._classId] || 0, false);
        this.refresh();
    }

    setCharacterImage(characterName: string, characterIndex: number): void {
        this._characterName = characterName;
        this._characterIndex = characterIndex;
    }

    setFaceImage(faceName: string, faceIndex: number): void {
        this._faceName = faceName;
        this._faceIndex = faceIndex;
    }

    setBattlerImage(battlerName: string): void {
        this._battlerName = battlerName;
    }

    isSpriteVisible(): boolean {
        return window.$gameSystem.isSideView();
    }

    startAnimation(animationId: number, mirror: boolean, delay: number): void {
        mirror = !mirror;
        super.startAnimation(animationId, mirror, delay);
    }

    performAction(action: Game_Action): void {
        super.performAction(action);
        if (action.isAttack()) {
            this.performAttack();
        } else if (action.isGuard()) {
            this.requestMotion('guard');
        } else if (action.isMagicSkill()) {
            this.requestMotion('spell');
        } else if (action.isSkill()) {
            this.requestMotion('skill');
        } else if (action.isItem()) {
            this.requestMotion('item');
        }
    }

    performAttack(): void {
        const weapons = this.weapons();
        const wtypeId = weapons[0] ? weapons[0].wtypeId : 0;
        const attackMotion = window.$dataSystem.attackMotions[wtypeId];
        if (attackMotion) {
            if (attackMotion.type === 0) {
                this.requestMotion('thrust');
            } else if (attackMotion.type === 1) {
                this.requestMotion('swing');
            } else if (attackMotion.type === 2) {
                this.requestMotion('missile');
            }
            this.startWeaponAnimation(attackMotion.weaponImageId);
        }
    }

    performDamage(): void {
        super.performDamage();
        if (this.isSpriteVisible()) {
            this.requestMotion('damage');
        } else {
            window.$gameScreen.startShake(5, 5, 10);
        }
        SoundManager.playActorDamage();
    }

    performEvasion(): void {
        super.performEvasion();
        this.requestMotion('evade');
    }

    performMagicEvasion(): void {
        super.performMagicEvasion();
        this.requestMotion('evade');
    }

    performCounter(): void {
        super.performCounter();
        this.performAttack();
    }

    performCollapse(): void {
        super.performCollapse();
        if (window.$gameParty.inBattle()) {
            SoundManager.playActorCollapse();
        }
    }

    performVictory(): void {
        if (this.canMove()) {
            this.requestMotion('victory');
        }
    }

    performEscape(): void {
        if (this.canMove()) {
            this.requestMotion('escape');
        }
    }

    makeActionList(): Game_Action[] {
        const list = [];
        let action = new Game_Action(this);
        action.setAttack();
        list.push(action);
        this.usableSkills().forEach(function (skill) {
            action = new Game_Action(this);
            action.setSkill(skill.id);
            list.push(action);
        }, this);
        return list;
    }

    makeAutoBattleActions(): void {
        for (let i = 0; i < this.numActions(); i++) {
            const list = this.makeActionList();
            let maxValue = Number.MIN_VALUE;
            for (let j = 0; j < list.length; j++) {
                const value = list[j].evaluate();
                if (value > maxValue) {
                    maxValue = value;
                    this.setAction(i, list[j]);
                }
            }
        }
        this.setActionState('waiting');
    }

    makeConfusionActions(): void {
        for (let i = 0; i < this.numActions(); i++) {
            this.action(i).setConfusion();
        }
        this.setActionState('waiting');
    }

    makeActions(): void {
        super.makeActions();
        if (this.numActions() > 0) {
            this.setActionState('undecided');
        } else {
            this.setActionState('waiting');
        }
        if (this.isAutoBattle()) {
            this.makeAutoBattleActions();
        } else if (this.isConfused()) {
            this.makeConfusionActions();
        }
    }

    onPlayerWalk(): void {
        this.clearResult();
        this.checkFloorEffect();
        if (window.$gamePlayer.isNormal()) {
            this.turnEndOnMap();
            this.states().forEach(function (state) {
                this.updateStateSteps(state);
            }, this);
            this.showAddedStates();
            this.showRemovedStates();
        }
    }

    updateStateSteps(state: RPGState): void {
        if (state.removeByWalking) {
            if (this._stateSteps[state.id] > 0) {
                if (--this._stateSteps[state.id] === 0) {
                    this.removeState(state.id);
                }
            }
        }
    }

    showAddedStates(): void {
        this.result()
            .addedStateObjects()
            .forEach((state) => {
                if (state.message1) {
                    window.$gameMessage.add(this._name + state.message1);
                }
            });
    }

    showRemovedStates(): void {
        this.result()
            .removedStateObjects()
            .forEach((state) => {
                if (state.message4) {
                    window.$gameMessage.add(this._name + state.message4);
                }
            });
    }

    stepsForTurn(): number {
        return 20;
    }

    turnEndOnMap(): void {
        if (window.$gameParty.steps() % this.stepsForTurn() === 0) {
            this.onTurnEnd();
            if (this.result().hpDamage > 0) {
                this.performMapDamage();
            }
        }
    }

    checkFloorEffect(): void {
        if (window.$gamePlayer.isOnDamageFloor()) {
            this.executeFloorDamage();
        }
    }

    executeFloorDamage(): void {
        let damage = Math.floor(this.basicFloorDamage() * this.fdr);
        damage = Math.min(damage, this.maxFloorDamage());
        this.gainHp(-damage);
        if (damage > 0) {
            this.performMapDamage();
        }
    }

    basicFloorDamage(): number {
        return 10;
    }

    maxFloorDamage(): number {
        return window.$dataSystem.optFloorDeath ? this.hp : Math.max(this.hp - 1, 0);
    }

    performMapDamage(): void {
        if (!window.$gameParty.inBattle()) {
            window.$gameScreen.startFlashForDamage();
        }
    }

    clearActions(): void {
        super.clearActions();
        this._actionInputIndex = 0;
    }

    inputtingAction(): Game_Action {
        return this.action(this._actionInputIndex);
    }

    selectNextCommand(): boolean {
        if (this._actionInputIndex < this.numActions() - 1) {
            this._actionInputIndex++;
            return true;
        } else {
            return false;
        }
    }

    selectPreviousCommand(): boolean {
        if (this._actionInputIndex > 0) {
            this._actionInputIndex--;
            return true;
        } else {
            return false;
        }
    }

    lastMenuSkill(): RPGSkill {
        return this._lastMenuSkill.object() as RPGSkill;
    }

    setLastMenuSkill(skill: RPGSkill): void {
        this._lastMenuSkill.setObject(skill);
    }

    lastBattleSkill(): RPGSkill {
        return this._lastBattleSkill.object() as RPGSkill;
    }

    setLastBattleSkill(skill: RPGSkill): void {
        this._lastBattleSkill.setObject(skill);
    }

    lastCommandSymbol(): string {
        return this._lastCommandSymbol;
    }

    setLastCommandSymbol(symbol: string): void {
        this._lastCommandSymbol = symbol;
    }

    testEscape(item: RPGSkill | RPGItem): boolean {
        return item.effects.some((effect) => effect && effect.code === Game_Action.EFFECT_SPECIAL);
    }

    meetsUsableItemConditions(item: RPGSkill | RPGItem): boolean {
        if (window.$gameParty.inBattle() && !BattleManager.canEscape() && this.testEscape(item)) {
            return false;
        }
        return super.meetsUsableItemConditions(item);
    }
}
