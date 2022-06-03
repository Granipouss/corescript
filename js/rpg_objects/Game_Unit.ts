import type { Game_Battler } from './Game_Battler';

/**
 * The superclass of Game_Party and Game_Troop.
 */
export abstract class Game_Unit<T extends Game_Battler = Game_Battler> {
    protected _inBattle: boolean;

    constructor() {
        this._inBattle = false;
    }

    inBattle(): boolean {
        return this._inBattle;
    }

    members(): T[] {
        return [];
    }

    aliveMembers(): T[] {
        return this.members().filter((member) => member.isAlive());
    }

    deadMembers(): T[] {
        return this.members().filter((member) => member.isDead());
    }

    movableMembers(): T[] {
        return this.members().filter((member) => member.canMove());
    }

    clearActions(): void {
        return this.members().forEach((member) => member.clearActions());
    }

    agility(): number {
        const members = this.members();
        if (members.length === 0) {
            return 1;
        }
        const sum = members.reduce((r, member) => r + member.agi, 0);
        return sum / members.length;
    }

    tgrSum(): number {
        return this.aliveMembers().reduce((r, member) => r + member.tgr, 0);
    }

    randomTarget(): T {
        let tgrRand = Math.random() * this.tgrSum();
        let target: T = null;
        this.aliveMembers().forEach((member) => {
            tgrRand -= member.tgr;
            if (tgrRand <= 0 && !target) {
                target = member;
            }
        });
        return target;
    }

    randomDeadTarget(): T {
        const members = this.deadMembers();
        if (members.length === 0) {
            return null;
        }
        return members[Math.floor(Math.random() * members.length)];
    }

    smoothTarget(index: number): T {
        if (index < 0) {
            index = 0;
        }
        const member = this.members()[index];
        return member && member.isAlive() ? member : this.aliveMembers()[0];
    }

    smoothDeadTarget(index: number): T {
        if (index < 0) {
            index = 0;
        }
        const member = this.members()[index];
        return member && member.isDead() ? member : this.deadMembers()[0];
    }

    clearResults(): void {
        this.members().forEach((member) => {
            member.clearResult();
        });
    }

    onBattleStart(): void {
        this.members().forEach((member) => {
            member.onBattleStart();
        });
        this._inBattle = true;
    }

    onBattleEnd(): void {
        this._inBattle = false;
        this.members().forEach((member) => {
            member.onBattleEnd();
        });
    }

    makeActions(): void {
        this.members().forEach((member) => {
            member.makeActions();
        });
    }

    select(activeMember: T): void {
        this.members().forEach((member) => {
            if (member === activeMember) {
                member.select();
            } else {
                member.deselect();
            }
        });
    }

    isAllDead(): boolean {
        return this.aliveMembers().length === 0;
    }

    substituteBattler(): T {
        const members = this.members();
        for (let i = 0; i < members.length; i++) {
            if (members[i].isSubstitute()) {
                return members[i];
            }
        }
    }
}
