import type { RPGArmor } from '../rpg_data/armor';
import type { RPGBattleEventPage } from '../rpg_data/battle-event-page';
import type { RPGItem } from '../rpg_data/item';
import type { RPGTroop } from '../rpg_data/troop';
import type { RPGWeapon } from '../rpg_data/weapon';

import { BattleManager } from '../rpg_managers/BattleManager';

import { Game_Enemy } from './Game_Enemy';
import { Game_Interpreter } from './Game_Interpreter';
import { Game_Unit } from './Game_Unit';

/**
 * The game object class for a troop and the battle-related data.
 */
export class Game_Troop extends Game_Unit<Game_Enemy> {
    static LETTER_TABLE_HALF = [
        ' A',
        ' B',
        ' C',
        ' D',
        ' E',
        ' F',
        ' G',
        ' H',
        ' I',
        ' J',
        ' K',
        ' L',
        ' M',
        ' N',
        ' O',
        ' P',
        ' Q',
        ' R',
        ' S',
        ' T',
        ' U',
        ' V',
        ' W',
        ' X',
        ' Y',
        ' Z',
    ];
    static LETTER_TABLE_FULL = [
        'Ａ',
        'Ｂ',
        'Ｃ',
        'Ｄ',
        'Ｅ',
        'Ｆ',
        'Ｇ',
        'Ｈ',
        'Ｉ',
        'Ｊ',
        'Ｋ',
        'Ｌ',
        'Ｍ',
        'Ｎ',
        'Ｏ',
        'Ｐ',
        'Ｑ',
        'Ｒ',
        'Ｓ',
        'Ｔ',
        'Ｕ',
        'Ｖ',
        'Ｗ',
        'Ｘ',
        'Ｙ',
        'Ｚ',
    ];

    private _interpreter: Game_Interpreter;
    private _turnCount: number;
    private _enemies: Game_Enemy[];
    private _troopId: number;
    private _eventFlags: Record<number, boolean>;
    private _namesCount: Record<string, number>;

    constructor() {
        super();
        this._interpreter = new Game_Interpreter();
        this.clear();
    }

    isEventRunning(): boolean {
        return this._interpreter.isRunning();
    }

    updateInterpreter(): void {
        this._interpreter.update();
    }

    turnCount(): number {
        return this._turnCount;
    }

    members(): Game_Enemy[] {
        return this._enemies;
    }

    clear(): void {
        this._interpreter.clear();
        this._troopId = 0;
        this._eventFlags = {};
        this._enemies = [];
        this._turnCount = 0;
        this._namesCount = {};
    }

    troop(): RPGTroop {
        return window.$dataTroops[this._troopId];
    }

    setup(troopId: number): void {
        this.clear();
        this._troopId = troopId;
        this._enemies = [];
        this.troop().members.forEach(function (member) {
            if (window.$dataEnemies[member.enemyId]) {
                const enemyId = member.enemyId;
                const x = member.x;
                const y = member.y;
                const enemy = new Game_Enemy(enemyId, x, y);
                if (member.hidden) {
                    enemy.hide();
                }
                this._enemies.push(enemy);
            }
        }, this);
        this.makeUniqueNames();
    }

    makeUniqueNames(): void {
        const table = this.letterTable();
        this.members().forEach((enemy) => {
            if (enemy.isAlive() && enemy.isLetterEmpty()) {
                const name = enemy.originalName();
                const n = this._namesCount[name] || 0;
                enemy.setLetter(table[n % table.length]);
                this._namesCount[name] = n + 1;
            }
        });
        this.members().forEach((enemy) => {
            const name = enemy.originalName();
            if (this._namesCount[name] >= 2) {
                enemy.setPlural(true);
            }
        });
    }

    letterTable(): string[] {
        return window.$gameSystem.isCJK() ? Game_Troop.LETTER_TABLE_FULL : Game_Troop.LETTER_TABLE_HALF;
    }

    enemyNames(): string[] {
        const names: string[] = [];
        this.members().forEach((enemy) => {
            const name = enemy.originalName();
            if (enemy.isAlive() && !names.includes(name)) {
                names.push(name);
            }
        });
        return names;
    }

    meetsConditions(page: RPGBattleEventPage): boolean {
        const c = page.conditions;
        if (!c.turnEnding && !c.turnValid && !c.enemyValid && !c.actorValid && !c.switchValid) {
            return false; // Conditions not set
        }
        if (c.turnEnding) {
            if (!BattleManager.isTurnEnd()) {
                return false;
            }
        }
        if (c.turnValid) {
            const n = this._turnCount;
            const a = c.turnA;
            const b = c.turnB;
            if (b === 0 && n !== a) {
                return false;
            }
            if (b > 0 && (n < 1 || n < a || n % b !== a % b)) {
                return false;
            }
        }
        if (c.enemyValid) {
            const enemy = window.$gameTroop.members()[c.enemyIndex];
            if (!enemy || enemy.hpRate() * 100 > c.enemyHp) {
                return false;
            }
        }
        if (c.actorValid) {
            const actor = window.$gameActors.actor(c.actorId);
            if (!actor || actor.hpRate() * 100 > c.actorHp) {
                return false;
            }
        }
        if (c.switchValid) {
            if (!window.$gameSwitches.value(c.switchId)) {
                return false;
            }
        }
        return true;
    }

    setupBattleEvent(): void {
        if (!this._interpreter.isRunning()) {
            if (this._interpreter.setupReservedCommonEvent()) {
                return;
            }
            const pages = this.troop().pages;
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                if (this.meetsConditions(page) && !this._eventFlags[i]) {
                    this._interpreter.setup(page.list);
                    this._interpreter.setEventInfo({
                        eventType: 'battle_event',
                        troopId: this._troopId,
                        page: i + 1,
                    });
                    if (page.span <= 1) {
                        this._eventFlags[i] = true;
                    }
                    break;
                }
            }
        }
    }

    increaseTurn(): void {
        const pages = this.troop().pages;
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (page.span === 1) {
                this._eventFlags[i] = false;
            }
        }
        this._turnCount++;
    }

    expTotal(): number {
        return this.deadMembers().reduce((r, enemy) => r + enemy.exp(), 0);
    }

    goldTotal(): number {
        return this.deadMembers().reduce((r, enemy) => r + enemy.gold(), 0) * this.goldRate();
    }

    goldRate(): number {
        return window.$gameParty.hasGoldDouble() ? 2 : 1;
    }

    makeDropItems(): (RPGItem | RPGWeapon | RPGArmor)[] {
        return this.deadMembers().reduce((r, enemy) => r.concat(enemy.makeDropItems()), []);
    }
}
