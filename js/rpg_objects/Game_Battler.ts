import { randomInt } from '../rpg_core/extension';
import type { RPGItem } from '../rpg_data/item';
import type { RPGSkill } from '../rpg_data/skill';
import { BattleManager } from '../rpg_managers/BattleManager';
import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { Game_Action } from './Game_Action';
import { Game_ActionResult } from './Game_ActionResult';
import { Game_BattlerBase } from './Game_BattlerBase';
import type { Game_Unit } from './Game_Unit';

export type AnimationData = {
    animationId: number;
    mirror: boolean;
    delay: number;
};

/**
 * The superclass of Game_Actor and Game_Enemy. It contains methods for sprites
 * and actions.
 */
export abstract class Game_Battler extends Game_BattlerBase {
    protected _actions: Game_Action[];
    protected _speed: number;
    protected _result: Game_ActionResult;
    protected _actionState: string;
    protected _lastTargetIndex: number;
    protected _animations: AnimationData[];
    protected _damagePopup: boolean;
    protected _effectType: string;
    protected _motionType: string;
    protected _weaponImageId: number;
    protected _motionRefresh: boolean;
    protected _selected: boolean;

    initMembers(): void {
        super.initMembers();
        this._actions = [];
        this._speed = 0;
        this._result = new Game_ActionResult();
        this._actionState = '';
        this._lastTargetIndex = 0;
        this._animations = [];
        this._damagePopup = false;
        this._effectType = null;
        this._motionType = null;
        this._weaponImageId = 0;
        this._motionRefresh = false;
        this._selected = false;
    }

    clearAnimations(): void {
        this._animations = [];
    }

    clearDamagePopup(): void {
        this._damagePopup = false;
    }

    clearWeaponAnimation(): void {
        this._weaponImageId = 0;
    }

    clearEffect(): void {
        this._effectType = null;
    }

    clearMotion(): void {
        this._motionType = null;
        this._motionRefresh = false;
    }

    requestEffect(effectType: string): void {
        this._effectType = effectType;
    }

    requestMotion(motionType: string): void {
        this._motionType = motionType;
    }

    requestMotionRefresh(): void {
        this._motionRefresh = true;
    }

    select(): void {
        this._selected = true;
    }

    deselect(): void {
        this._selected = false;
    }

    isAnimationRequested(): boolean {
        return this._animations.length > 0;
    }

    isDamagePopupRequested(): boolean {
        return this._damagePopup;
    }

    isEffectRequested(): boolean {
        return !!this._effectType;
    }

    isMotionRequested(): boolean {
        return !!this._motionType;
    }

    isWeaponAnimationRequested(): boolean {
        return this._weaponImageId > 0;
    }

    isMotionRefreshRequested(): boolean {
        return this._motionRefresh;
    }

    isSelected(): boolean {
        return this._selected;
    }

    effectType(): string {
        return this._effectType;
    }

    motionType(): string {
        return this._motionType;
    }

    weaponImageId(): number {
        return this._weaponImageId;
    }

    shiftAnimation(): AnimationData {
        return this._animations.shift();
    }

    startAnimation(animationId: number, mirror: boolean, delay: number): void {
        const data = { animationId: animationId, mirror: mirror, delay: delay };
        this._animations.push(data);
    }

    startDamagePopup(): void {
        this._damagePopup = true;
    }

    startWeaponAnimation(weaponImageId: number): void {
        this._weaponImageId = weaponImageId;
    }

    action(index: number): Game_Action {
        return this._actions[index];
    }

    setAction(index: number, action: Game_Action): void {
        this._actions[index] = action;
    }

    numActions(): number {
        return this._actions.length;
    }

    clearActions(): void {
        this._actions = [];
    }

    result(): Game_ActionResult {
        return this._result;
    }

    clearResult(): void {
        this._result.clear();
    }

    refresh(): void {
        super.refresh();
        if (this.hp === 0) {
            this.addState(this.deathStateId());
        } else {
            this.removeState(this.deathStateId());
        }
    }

    addState(stateId: number): void {
        if (this.isStateAddable(stateId)) {
            if (!this.isStateAffected(stateId)) {
                this.addNewState(stateId);
                this.refresh();
            }
            this.resetStateCounts(stateId);
            this._result.pushAddedState(stateId);
        }
    }

    isStateAddable(stateId: number): boolean {
        return (
            this.isAlive() &&
            window.$dataStates[stateId] &&
            !this.isStateResist(stateId) &&
            !this._result.isStateRemoved(stateId) &&
            !this.isStateRestrict(stateId)
        );
    }

    isStateRestrict(stateId: number): boolean {
        return window.$dataStates[stateId].removeByRestriction && this.isRestricted();
    }

    onRestrict(): void {
        super.onRestrict();
        this.clearActions();
        this.states().forEach(function (state) {
            if (state.removeByRestriction) {
                this.removeState(state.id);
            }
        }, this);
    }

    removeState(stateId: number): void {
        if (this.isStateAffected(stateId)) {
            if (stateId === this.deathStateId()) {
                this.revive();
            }
            this.eraseState(stateId);
            this.refresh();
            this._result.pushRemovedState(stateId);
        }
    }

    escape(): void {
        if (window.$gameParty.inBattle()) {
            this.hide();
        }
        this.clearActions();
        this.clearStates();
        SoundManager.playEscape();
    }

    addBuff(paramId: number, turns: number): void {
        if (this.isAlive()) {
            this.increaseBuff(paramId);
            if (this.isBuffAffected(paramId)) {
                this.overwriteBuffTurns(paramId, turns);
            }
            this._result.pushAddedBuff(paramId);
            this.refresh();
        }
    }

    addDebuff(paramId: number, turns: number): void {
        if (this.isAlive()) {
            this.decreaseBuff(paramId);
            if (this.isDebuffAffected(paramId)) {
                this.overwriteBuffTurns(paramId, turns);
            }
            this._result.pushAddedDebuff(paramId);
            this.refresh();
        }
    }

    removeBuff(paramId: number): void {
        if (this.isAlive() && this.isBuffOrDebuffAffected(paramId)) {
            this.eraseBuff(paramId);
            this._result.pushRemovedBuff(paramId);
            this.refresh();
        }
    }

    removeBattleStates(): void {
        this.states().forEach((state) => {
            if (state.removeAtBattleEnd) {
                this.removeState(state.id);
            }
        });
    }

    removeAllBuffs(): void {
        for (let i = 0; i < this.buffLength(); i++) {
            this.removeBuff(i);
        }
    }

    removeStatesAuto(timing: number): void {
        this.states().forEach((state) => {
            if (this.isStateExpired(state.id) && state.autoRemovalTiming === timing) {
                this.removeState(state.id);
            }
        });
    }

    removeBuffsAuto(): void {
        for (let i = 0; i < this.buffLength(); i++) {
            if (this.isBuffExpired(i)) {
                this.removeBuff(i);
            }
        }
    }

    removeStatesByDamage(): void {
        this.states().forEach((state) => {
            if (state.removeByDamage && randomInt(100) < state.chanceByDamage) {
                this.removeState(state.id);
            }
        });
    }

    makeActionTimes(): number {
        return this.actionPlusSet().reduce((r, p) => (Math.random() < p ? r + 1 : r), 1);
    }

    makeActions(): void {
        this.clearActions();
        if (this.canMove()) {
            const actionTimes = this.makeActionTimes();
            this._actions = [];
            for (let i = 0; i < actionTimes; i++) {
                this._actions.push(new Game_Action(this));
            }
        }
    }

    speed(): number {
        return this._speed;
    }

    makeSpeed(): void {
        this._speed = Math.min(...this._actions.map((action) => action.speed())) || 0;
    }

    currentAction(): Game_Action {
        return this._actions[0];
    }

    removeCurrentAction(): void {
        this._actions.shift();
    }

    setLastTarget(target: Game_Battler | null): void {
        if (target) {
            this._lastTargetIndex = target.index();
        } else {
            this._lastTargetIndex = 0;
        }
    }

    forceAction(skillId: number, targetIndex: number): void {
        this.clearActions();
        const action = new Game_Action(this, true);
        action.setSkill(skillId);
        if (targetIndex === -2) {
            action.setTarget(this._lastTargetIndex);
        } else if (targetIndex === -1) {
            action.decideRandomTarget();
        } else {
            action.setTarget(targetIndex);
        }
        this._actions.push(action);
    }

    useItem(item: RPGItem | RPGSkill): void {
        if (DataManager.isSkill(item)) {
            this.paySkillCost(item);
        } else if (DataManager.isItem(item)) {
            this.consumeItem(item);
        }
    }

    consumeItem(item: RPGItem): void {
        window.$gameParty.consumeItem(item);
    }

    gainHp(value: number): void {
        this._result.hpDamage = -value;
        this._result.hpAffected = true;
        this.setHp(this.hp + value);
    }

    gainMp(value: number): void {
        this._result.mpDamage = -value;
        this.setMp(this.mp + value);
    }

    gainTp(value: number): void {
        this._result.tpDamage = -value;
        this.setTp(this.tp + value);
    }

    gainSilentTp(value: number): void {
        this.setTp(this.tp + value);
    }

    initTp(): void {
        this.setTp(randomInt(25));
    }

    clearTp(): void {
        this.setTp(0);
    }

    chargeTpByDamage(damageRate: number): void {
        const value = Math.floor(50 * damageRate * this.tcr);
        this.gainSilentTp(value);
    }

    regenerateHp(): void {
        let value = Math.floor(this.mhp * this.hrg);
        value = Math.max(value, -this.maxSlipDamage());
        if (value !== 0) {
            this.gainHp(value);
        }
    }

    maxSlipDamage(): number {
        return window.$dataSystem.optSlipDeath ? this.hp : Math.max(this.hp - 1, 0);
    }

    regenerateMp(): void {
        const value = Math.floor(this.mmp * this.mrg);
        if (value !== 0) {
            this.gainMp(value);
        }
    }

    regenerateTp(): void {
        const value = Math.floor(100 * this.trg);
        this.gainSilentTp(value);
    }

    regenerateAll(): void {
        if (this.isAlive()) {
            this.regenerateHp();
            this.regenerateMp();
            this.regenerateTp();
        }
    }

    onBattleStart(): void {
        this.setActionState('undecided');
        this.clearMotion();
        if (!this.isPreserveTp()) {
            this.initTp();
        }
    }

    onAllActionsEnd(): void {
        this.clearResult();
        this.removeStatesAuto(1);
        this.removeBuffsAuto();
    }

    onTurnEnd(): void {
        this.clearResult();
        this.regenerateAll();
        if (!BattleManager.isForcedTurn()) {
            this.updateStateTurns();
            this.updateBuffTurns();
        }
        this.removeStatesAuto(2);
    }

    onBattleEnd(): void {
        this.clearResult();
        this.removeBattleStates();
        this.removeAllBuffs();
        this.clearActions();
        if (!this.isPreserveTp()) {
            this.clearTp();
        }
        this.appear();
    }

    onDamage(value: number): void {
        this.removeStatesByDamage();
        this.chargeTpByDamage(value / this.mhp);
    }

    setActionState(actionState: string): void {
        this._actionState = actionState;
        this.requestMotionRefresh();
    }

    isUndecided(): boolean {
        return this._actionState === 'undecided';
    }

    isInputting(): boolean {
        return this._actionState === 'inputting';
    }

    isWaiting(): boolean {
        return this._actionState === 'waiting';
    }

    isActing(): boolean {
        return this._actionState === 'acting';
    }

    isChanting(): boolean {
        if (this.isWaiting()) {
            return this._actions.some((action) => action.isMagicSkill());
        }
        return false;
    }

    isGuardWaiting(): boolean {
        if (this.isWaiting()) {
            return this._actions.some((action) => action.isGuard());
        }
        return false;
    }

    performActionStart(action: Game_Action): void {
        if (!action.isGuard()) {
            this.setActionState('acting');
        }
    }

    performAction(_action: Game_Action): void {
        // ...
    }

    performActionEnd(): void {
        this.setActionState('done');
    }

    performDamage(): void {
        // ...
    }

    performMiss(): void {
        SoundManager.playMiss();
    }

    performRecovery(): void {
        SoundManager.playRecovery();
    }

    performEvasion(): void {
        SoundManager.playEvasion();
    }

    performMagicEvasion(): void {
        SoundManager.playMagicEvasion();
    }

    performCounter(): void {
        SoundManager.playEvasion();
    }

    performReflection(): void {
        SoundManager.playReflection();
    }

    performSubstitute(_target: Game_Battler): void {
        // ...
    }

    performCollapse(): void {
        // ...
    }

    abstract index(): number;
    abstract name(): string;
    abstract isBattleMember(): boolean;
    abstract isSpriteVisible(): boolean;

    abstract friendsUnit(): Game_Unit;
    abstract opponentsUnit(): Game_Unit;
}
