import type { RPGState } from '../rpg_data/state';

/**
 * The game object class for a result of a battle action. For convinience, all
 * member variables in this class are public.
 */
export class Game_ActionResult {
    used: boolean;
    missed: boolean;
    evaded: boolean;
    physical: boolean;
    drain: boolean;
    critical: boolean;
    success: boolean;
    hpAffected: boolean;
    hpDamage: number;
    mpDamage: number;
    tpDamage: number;
    addedStates: number[];
    removedStates: number[];
    addedBuffs: number[];
    addedDebuffs: number[];
    removedBuffs: number[];

    constructor() {
        this.clear();
    }

    clear(): void {
        this.used = false;
        this.missed = false;
        this.evaded = false;
        this.physical = false;
        this.drain = false;
        this.critical = false;
        this.success = false;
        this.hpAffected = false;
        this.hpDamage = 0;
        this.mpDamage = 0;
        this.tpDamage = 0;
        this.addedStates = [];
        this.removedStates = [];
        this.addedBuffs = [];
        this.addedDebuffs = [];
        this.removedBuffs = [];
    }

    addedStateObjects(): RPGState[] {
        return this.addedStates.map((id) => window.$dataStates[id]);
    }

    removedStateObjects(): RPGState[] {
        return this.removedStates.map((id) => window.$dataStates[id]);
    }

    isStatusAffected(): boolean {
        return (
            this.addedStates.length > 0 ||
            this.removedStates.length > 0 ||
            this.addedBuffs.length > 0 ||
            this.addedDebuffs.length > 0 ||
            this.removedBuffs.length > 0
        );
    }

    isHit(): boolean {
        return this.used && !this.missed && !this.evaded;
    }

    isStateAdded(stateId: number): boolean {
        return this.addedStates.includes(stateId);
    }

    pushAddedState(stateId: number): void {
        if (!this.isStateAdded(stateId)) {
            this.addedStates.push(stateId);
        }
    }

    isStateRemoved(stateId: number): boolean {
        return this.removedStates.includes(stateId);
    }

    pushRemovedState(stateId: number): void {
        if (!this.isStateRemoved(stateId)) {
            this.removedStates.push(stateId);
        }
    }

    isBuffAdded(paramId: number): boolean {
        return this.addedBuffs.includes(paramId);
    }

    pushAddedBuff(paramId: number): void {
        if (!this.isBuffAdded(paramId)) {
            this.addedBuffs.push(paramId);
        }
    }

    isDebuffAdded(paramId: number): boolean {
        return this.addedDebuffs.includes(paramId);
    }

    pushAddedDebuff(paramId: number): void {
        if (!this.isDebuffAdded(paramId)) {
            this.addedDebuffs.push(paramId);
        }
    }

    isBuffRemoved(paramId: number): boolean {
        return this.removedBuffs.includes(paramId);
    }

    pushRemovedBuff(paramId: number): void {
        if (!this.isBuffRemoved(paramId)) {
            this.removedBuffs.push(paramId);
        }
    }
}
