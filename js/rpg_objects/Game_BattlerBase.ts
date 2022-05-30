import { clamp, randomInt } from '../rpg_core/extension';
import { RPGArmor } from '../rpg_data/armor';
import { RPGItem } from '../rpg_data/item';
import { RPGSkill } from '../rpg_data/skill';
import { RPGState } from '../rpg_data/state';
import { RPGTrait, RPGTraitObject } from '../rpg_data/trait';
import { RPGWeapon } from '../rpg_data/weapon';
import { DataManager } from '../rpg_managers/DataManager';
import { Game_Actor } from './Game_Actor';
import { Game_Enemy } from './Game_Enemy';

/**
 * The superclass of Game_Battler. It mainly contains parameters calculation.
 */
export abstract class Game_BattlerBase {
    static TRAIT_ELEMENT_RATE = 11;
    static TRAIT_DEBUFF_RATE = 12;
    static TRAIT_STATE_RATE = 13;
    static TRAIT_STATE_RESIST = 14;
    static TRAIT_PARAM = 21;
    static TRAIT_XPARAM = 22;
    static TRAIT_SPARAM = 23;
    static TRAIT_ATTACK_ELEMENT = 31;
    static TRAIT_ATTACK_STATE = 32;
    static TRAIT_ATTACK_SPEED = 33;
    static TRAIT_ATTACK_TIMES = 34;
    static TRAIT_STYPE_ADD = 41;
    static TRAIT_STYPE_SEAL = 42;
    static TRAIT_SKILL_ADD = 43;
    static TRAIT_SKILL_SEAL = 44;
    static TRAIT_EQUIP_WTYPE = 51;
    static TRAIT_EQUIP_ATYPE = 52;
    static TRAIT_EQUIP_LOCK = 53;
    static TRAIT_EQUIP_SEAL = 54;
    static TRAIT_SLOT_TYPE = 55;
    static TRAIT_ACTION_PLUS = 61;
    static TRAIT_SPECIAL_FLAG = 62;
    static TRAIT_COLLAPSE_TYPE = 63;
    static TRAIT_PARTY_ABILITY = 64;
    static FLAG_ID_AUTO_BATTLE = 0;
    static FLAG_ID_GUARD = 1;
    static FLAG_ID_SUBSTITUTE = 2;
    static FLAG_ID_PRESERVE_TP = 3;
    static ICON_BUFF_START = 32;
    static ICON_DEBUFF_START = 48;

    protected _hp: number;
    protected _mp: number;
    protected _tp: number;
    protected _hidden: boolean;
    protected _paramPlus: number[];
    protected _states: number[];
    protected _stateTurns: Record<number, number>;
    protected _buffs: number[];
    protected _buffTurns: number[];

    // Hit Points
    get hp(): number {
        return this._hp;
    }

    // Magic Points
    get mp(): number {
        return this._mp;
    }

    // Tactical Points
    get tp(): number {
        return this._tp;
    }

    // Maximum Hit Points
    get mhp(): number {
        return this.param(0);
    }

    // Maximum Magic Points
    get mmp(): number {
        return this.param(1);
    }

    // ATtacK power
    get atk(): number {
        return this.param(2);
    }

    // DEFense power
    get def(): number {
        return this.param(3);
    }

    // Magic ATtack power
    get mat(): number {
        return this.param(4);
    }

    // Magic DeFense power
    get mdf(): number {
        return this.param(5);
    }

    // AGIlity
    get agi(): number {
        return this.param(6);
    }

    // LUcK
    get luk(): number {
        return this.param(7);
    }

    // HIT rate
    get hit(): number {
        return this.xparam(0);
    }

    // EVAsion rate
    get eva(): number {
        return this.xparam(1);
    }

    // CRItical rate
    get cri(): number {
        return this.xparam(2);
    }

    // Critical EVasion rate
    get cev(): number {
        return this.xparam(3);
    }

    // Magic EVasion rate
    get mev(): number {
        return this.xparam(4);
    }

    // Magic ReFlection rate
    get mrf(): number {
        return this.xparam(5);
    }

    // CouNTer attack rate
    get cnt(): number {
        return this.xparam(6);
    }

    // Hp ReGeneration rate
    get hrg(): number {
        return this.xparam(7);
    }

    // Mp ReGeneration rate
    get mrg(): number {
        return this.xparam(8);
    }

    // Tp ReGeneration rate
    get trg(): number {
        return this.xparam(9);
    }

    // TarGet Rate
    get tgr(): number {
        return this.sparam(0);
    }

    // GuaRD effect rate
    get grd(): number {
        return this.sparam(1);
    }

    // RECovery effect rate
    get rec(): number {
        return this.sparam(2);
    }

    // PHArmacology
    get pha(): number {
        return this.sparam(3);
    }

    // Mp Cost Rate
    get mcr(): number {
        return this.sparam(4);
    }

    // Tp Charge Rate
    get tcr(): number {
        return this.sparam(5);
    }

    // Physical Damage Rate
    get pdr(): number {
        return this.sparam(6);
    }

    // Magical Damage Rate
    get mdr(): number {
        return this.sparam(7);
    }

    // Floor Damage Rate
    get fdr(): number {
        return this.sparam(8);
    }

    // EXperience Rate
    get exr(): number {
        return this.sparam(9);
    }

    constructor() {
        this.initMembers();
    }

    initMembers(): void {
        this._hp = 1;
        this._mp = 0;
        this._tp = 0;
        this._hidden = false;
        this.clearParamPlus();
        this.clearStates();
        this.clearBuffs();
    }

    clearParamPlus(): void {
        this._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
    }

    clearStates(): void {
        this._states = [];
        this._stateTurns = {};
    }

    eraseState(stateId: number): void {
        const index = this._states.indexOf(stateId);
        if (index >= 0) {
            this._states.splice(index, 1);
        }
        delete this._stateTurns[stateId];
    }

    isStateAffected(stateId: number): boolean {
        return this._states.includes(stateId);
    }

    isDeathStateAffected(): boolean {
        return this.isStateAffected(this.deathStateId());
    }

    deathStateId(): number {
        return 1;
    }

    resetStateCounts(stateId: number): void {
        const state = window.$dataStates[stateId];
        const variance = 1 + Math.max(state.maxTurns - state.minTurns, 0);
        this._stateTurns[stateId] = state.minTurns + randomInt(variance);
    }

    isStateExpired(stateId: number): boolean {
        return this._stateTurns[stateId] === 0;
    }

    updateStateTurns(): void {
        this._states.forEach((stateId) => {
            if (this._stateTurns[stateId] > 0) {
                this._stateTurns[stateId]--;
            }
        });
    }

    clearBuffs(): void {
        this._buffs = [0, 0, 0, 0, 0, 0, 0, 0];
        this._buffTurns = [0, 0, 0, 0, 0, 0, 0, 0];
    }

    eraseBuff(paramId: number): void {
        this._buffs[paramId] = 0;
        this._buffTurns[paramId] = 0;
    }

    buffLength(): number {
        return this._buffs.length;
    }

    buff(paramId: number): number {
        return this._buffs[paramId];
    }

    isBuffAffected(paramId: number): boolean {
        return this._buffs[paramId] > 0;
    }

    isDebuffAffected(paramId: number): boolean {
        return this._buffs[paramId] < 0;
    }

    isBuffOrDebuffAffected(paramId: number): boolean {
        return this._buffs[paramId] !== 0;
    }

    isMaxBuffAffected(paramId: number): boolean {
        return this._buffs[paramId] === 2;
    }

    isMaxDebuffAffected(paramId: number): boolean {
        return this._buffs[paramId] === -2;
    }

    increaseBuff(paramId: number): void {
        if (!this.isMaxBuffAffected(paramId)) {
            this._buffs[paramId]++;
        }
    }

    decreaseBuff(paramId: number): void {
        if (!this.isMaxDebuffAffected(paramId)) {
            this._buffs[paramId]--;
        }
    }

    overwriteBuffTurns(paramId: number, turns: number): void {
        if (this._buffTurns[paramId] < turns) {
            this._buffTurns[paramId] = turns;
        }
    }

    isBuffExpired(paramId: number): boolean {
        return this._buffTurns[paramId] === 0;
    }

    updateBuffTurns(): void {
        for (let i = 0; i < this._buffTurns.length; i++) {
            if (this._buffTurns[i] > 0) {
                this._buffTurns[i]--;
            }
        }
    }

    die(): void {
        this._hp = 0;
        this.clearStates();
        this.clearBuffs();
    }

    revive(): void {
        if (this._hp === 0) {
            this._hp = 1;
        }
    }

    states(): RPGState[] {
        return this._states.map((id) => window.$dataStates[id]);
    }

    stateIcons(): number[] {
        return this.states()
            .map((state) => state.iconIndex)
            .filter((iconIndex) => iconIndex > 0);
    }

    buffIcons(): number[] {
        const icons = [];
        for (let i = 0; i < this._buffs.length; i++) {
            if (this._buffs[i] !== 0) {
                icons.push(this.buffIconIndex(this._buffs[i], i));
            }
        }
        return icons;
    }

    buffIconIndex(buffLevel: number, paramId: number): number {
        if (buffLevel > 0) {
            return Game_BattlerBase.ICON_BUFF_START + (buffLevel - 1) * 8 + paramId;
        } else if (buffLevel < 0) {
            return Game_BattlerBase.ICON_DEBUFF_START + (-buffLevel - 1) * 8 + paramId;
        } else {
            return 0;
        }
    }

    allIcons(): number[] {
        return this.stateIcons().concat(this.buffIcons());
    }

    traitObjects(): RPGTraitObject[] {
        // Returns an array of the all objects having traits. States only here.
        return this.states();
    }

    allTraits(): RPGTrait[] {
        return this.traitObjects().reduce((r, obj) => r.concat(obj.traits), []);
    }

    traits(code: number): RPGTrait[] {
        return this.allTraits().filter((trait) => trait.code === code);
    }

    traitsWithId(code: number, id: number): RPGTrait[] {
        return this.allTraits().filter((trait) => trait.code === code && trait.dataId === id);
    }

    traitsPi(code: number, id: number): number {
        return this.traitsWithId(code, id).reduce((r, trait) => r * trait.value, 1);
    }

    traitsSum(code: number, id: number): number {
        return this.traitsWithId(code, id).reduce((r, trait) => r + trait.value, 0);
    }

    traitsSumAll(code: number): number {
        return this.traits(code).reduce((r, trait) => r + trait.value, 0);
    }

    traitsSet(code: number): number[] {
        return this.traits(code).reduce((r, trait) => r.concat(trait.dataId), []);
    }

    paramBase(_paramId: number): number {
        return 0;
    }

    paramPlus(paramId: number): number {
        return this._paramPlus[paramId];
    }

    paramMin(paramId: number): number {
        if (paramId === 1) {
            return 0; // MMP
        } else {
            return 1;
        }
    }

    paramMax(paramId: number): number {
        if (paramId === 0) {
            return 999999; // MHP
        } else if (paramId === 1) {
            return 9999; // MMP
        } else {
            return 999;
        }
    }

    paramRate(paramId: number): number {
        return this.traitsPi(Game_BattlerBase.TRAIT_PARAM, paramId);
    }

    paramBuffRate(paramId: number): number {
        return this._buffs[paramId] * 0.25 + 1.0;
    }

    param(paramId: number): number {
        let value = this.paramBase(paramId) + this.paramPlus(paramId);
        value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
        const maxValue = this.paramMax(paramId);
        const minValue = this.paramMin(paramId);
        return Math.round(clamp(value, [minValue, maxValue]));
    }

    xparam(xparamId: number): number {
        return this.traitsSum(Game_BattlerBase.TRAIT_XPARAM, xparamId);
    }

    sparam(sparamId: number): number {
        return this.traitsPi(Game_BattlerBase.TRAIT_SPARAM, sparamId);
    }

    elementRate(elementId: number): number {
        return this.traitsPi(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId);
    }

    debuffRate(paramId: number): number {
        return this.traitsPi(Game_BattlerBase.TRAIT_DEBUFF_RATE, paramId);
    }

    stateRate(stateId: number): number {
        return this.traitsPi(Game_BattlerBase.TRAIT_STATE_RATE, stateId);
    }

    stateResistSet(): number[] {
        return this.traitsSet(Game_BattlerBase.TRAIT_STATE_RESIST);
    }

    isStateResist(stateId: number): boolean {
        return this.stateResistSet().includes(stateId);
    }

    attackElements(): number[] {
        return this.traitsSet(Game_BattlerBase.TRAIT_ATTACK_ELEMENT);
    }

    attackStates(): number[] {
        return this.traitsSet(Game_BattlerBase.TRAIT_ATTACK_STATE);
    }

    attackStatesRate(stateId: number): number {
        return this.traitsSum(Game_BattlerBase.TRAIT_ATTACK_STATE, stateId);
    }

    attackSpeed(): number {
        return this.traitsSumAll(Game_BattlerBase.TRAIT_ATTACK_SPEED);
    }

    attackTimesAdd(): number {
        return Math.max(this.traitsSumAll(Game_BattlerBase.TRAIT_ATTACK_TIMES), 0);
    }

    addedSkillTypes(): number[] {
        return this.traitsSet(Game_BattlerBase.TRAIT_STYPE_ADD);
    }

    isSkillTypeSealed(stypeId: number): boolean {
        return this.traitsSet(Game_BattlerBase.TRAIT_STYPE_SEAL).includes(stypeId);
    }

    addedSkills(): number[] {
        return this.traitsSet(Game_BattlerBase.TRAIT_SKILL_ADD);
    }

    isSkillSealed(skillId: number): boolean {
        return this.traitsSet(Game_BattlerBase.TRAIT_SKILL_SEAL).includes(skillId);
    }

    isEquipWtypeOk(wtypeId: number): boolean {
        return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_WTYPE).includes(wtypeId);
    }

    isEquipAtypeOk(atypeId: number): boolean {
        return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_ATYPE).includes(atypeId);
    }

    isEquipTypeLocked(etypeId: number): boolean {
        return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_LOCK).includes(etypeId);
    }

    isEquipTypeSealed(etypeId: number): boolean {
        return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_SEAL).includes(etypeId);
    }

    slotType(): number {
        const set = this.traitsSet(Game_BattlerBase.TRAIT_SLOT_TYPE);
        return set.length > 0 ? Math.max(...set) : 0;
    }

    isDualWield(): boolean {
        return this.slotType() === 1;
    }

    actionPlusSet(): number[] {
        return this.traits(Game_BattlerBase.TRAIT_ACTION_PLUS).map((trait) => trait.value);
    }

    specialFlag(flagId: number): boolean {
        return this.traits(Game_BattlerBase.TRAIT_SPECIAL_FLAG).some((trait) => trait.dataId === flagId);
    }

    collapseType(): number {
        const set = this.traitsSet(Game_BattlerBase.TRAIT_COLLAPSE_TYPE);
        return set.length > 0 ? Math.max(...set) : 0;
    }

    partyAbility(abilityId: number): boolean {
        return this.traits(Game_BattlerBase.TRAIT_PARTY_ABILITY).some((trait) => trait.dataId === abilityId);
    }

    isAutoBattle(): boolean {
        return this.specialFlag(Game_BattlerBase.FLAG_ID_AUTO_BATTLE);
    }

    isGuard(): boolean {
        return this.specialFlag(Game_BattlerBase.FLAG_ID_GUARD) && this.canMove();
    }

    isSubstitute(): boolean {
        return this.specialFlag(Game_BattlerBase.FLAG_ID_SUBSTITUTE) && this.canMove();
    }

    isPreserveTp(): boolean {
        return this.specialFlag(Game_BattlerBase.FLAG_ID_PRESERVE_TP);
    }

    addParam(paramId: number, value: number): void {
        this._paramPlus[paramId] += value;
        this.refresh();
    }

    setHp(hp: number): void {
        this._hp = hp;
        this.refresh();
    }

    setMp(mp: number): void {
        this._mp = mp;
        this.refresh();
    }

    setTp(tp: number): void {
        this._tp = tp;
        this.refresh();
    }

    maxTp(): number {
        return 100;
    }

    refresh(): void {
        this.stateResistSet().forEach((stateId) => {
            this.eraseState(stateId);
        });
        this._hp = clamp(this._hp, [0, this.mhp]);
        this._mp = clamp(this._mp, [0, this.mmp]);
        this._tp = clamp(this._tp, [0, this.maxTp()]);
    }

    recoverAll(): void {
        this.clearStates();
        this._hp = this.mhp;
        this._mp = this.mmp;
    }

    hpRate(): number {
        return this.hp / this.mhp;
    }

    mpRate(): number {
        return this.mmp > 0 ? this.mp / this.mmp : 0;
    }

    tpRate(): number {
        return this.tp / this.maxTp();
    }

    hide(): void {
        this._hidden = true;
    }

    appear(): void {
        this._hidden = false;
    }

    isHidden(): boolean {
        return this._hidden;
    }

    isAppeared(): boolean {
        return !this.isHidden();
    }

    isDead(): boolean {
        return this.isAppeared() && this.isDeathStateAffected();
    }

    isAlive(): boolean {
        return this.isAppeared() && !this.isDeathStateAffected();
    }

    isDying(): boolean {
        return this.isAlive() && this._hp < this.mhp / 4;
    }

    isRestricted(): boolean {
        return this.isAppeared() && this.restriction() > 0;
    }

    canInput(): boolean {
        return this.isAppeared() && !this.isRestricted() && !this.isAutoBattle();
    }

    canMove(): boolean {
        return this.isAppeared() && this.restriction() < 4;
    }

    isConfused(): boolean {
        return this.isAppeared() && this.restriction() >= 1 && this.restriction() <= 3;
    }

    confusionLevel(): number {
        return this.isConfused() ? this.restriction() : 0;
    }

    isActor(): this is Game_Actor {
        return false;
    }

    isEnemy(): this is Game_Enemy {
        return false;
    }

    sortStates(): void {
        this._states.sort((a, b) => {
            const p1 = window.$dataStates[a].priority;
            const p2 = window.$dataStates[b].priority;
            if (p1 !== p2) {
                return p2 - p1;
            }
            return a - b;
        });
    }

    restriction(): number {
        return Math.max(
            ...this.states()
                .map((state) => state.restriction)
                .concat(0)
        );
    }

    addNewState(stateId: number): void {
        if (stateId === this.deathStateId()) {
            this.die();
        }
        const restricted = this.isRestricted();
        this._states.push(stateId);
        this.sortStates();
        if (!restricted && this.isRestricted()) {
            this.onRestrict();
        }
    }

    onRestrict(): void {
        // ...
    }

    mostImportantStateText(): string {
        const states = this.states();
        for (let i = 0; i < states.length; i++) {
            if (states[i].message3) {
                return states[i].message3;
            }
        }
        return '';
    }

    stateMotionIndex(): number {
        const states = this.states();
        if (states.length > 0) {
            return states[0].motion;
        } else {
            return 0;
        }
    }

    stateOverlayIndex(): number {
        const states = this.states();
        if (states.length > 0) {
            return states[0].overlay;
        } else {
            return 0;
        }
    }

    isSkillWtypeOk(_skill: RPGSkill): boolean {
        return true;
    }

    skillMpCost(skill: RPGSkill): number {
        return Math.floor(skill.mpCost * this.mcr);
    }

    skillTpCost(skill: RPGSkill): number {
        return skill.tpCost;
    }

    canPaySkillCost(skill: RPGSkill): boolean {
        return this._tp >= this.skillTpCost(skill) && this._mp >= this.skillMpCost(skill);
    }

    paySkillCost(skill: RPGSkill): void {
        this._mp -= this.skillMpCost(skill);
        this._tp -= this.skillTpCost(skill);
    }

    isOccasionOk(item: RPGSkill | RPGItem): boolean {
        if (window.$gameParty.inBattle()) {
            return item.occasion === 0 || item.occasion === 1;
        } else {
            return item.occasion === 0 || item.occasion === 2;
        }
    }

    meetsUsableItemConditions(item: RPGSkill | RPGItem) {
        return this.canMove() && this.isOccasionOk(item);
    }

    meetsSkillConditions(skill: RPGSkill): boolean {
        return (
            this.meetsUsableItemConditions(skill) &&
            this.isSkillWtypeOk(skill) &&
            this.canPaySkillCost(skill) &&
            !this.isSkillSealed(skill.id) &&
            !this.isSkillTypeSealed(skill.stypeId)
        );
    }

    meetsItemConditions(item: RPGItem): boolean {
        return this.meetsUsableItemConditions(item) && window.$gameParty.hasItem(item);
    }

    canUse(item: unknown): boolean {
        if (!item) {
            return false;
        } else if (DataManager.isSkill(item)) {
            return this.meetsSkillConditions(item);
        } else if (DataManager.isItem(item)) {
            return this.meetsItemConditions(item);
        } else {
            return false;
        }
    }

    canEquip(item: unknown): item is RPGWeapon | RPGArmor {
        if (!item) {
            return false;
        } else if (DataManager.isWeapon(item)) {
            return this.canEquipWeapon(item);
        } else if (DataManager.isArmor(item)) {
            return this.canEquipArmor(item);
        } else {
            return false;
        }
    }

    canEquipWeapon(item: RPGWeapon): boolean {
        return this.isEquipWtypeOk(item.wtypeId) && !this.isEquipTypeSealed(item.etypeId);
    }

    canEquipArmor(item: RPGArmor): boolean {
        return this.isEquipAtypeOk(item.atypeId) && !this.isEquipTypeSealed(item.etypeId);
    }

    attackSkillId(): number {
        return 1;
    }

    guardSkillId(): number {
        return 2;
    }

    canAttack(): boolean {
        return this.canUse(window.$dataSkills[this.attackSkillId()]);
    }

    canGuard(): boolean {
        return this.canUse(window.$dataSkills[this.guardSkillId()]);
    }
}
