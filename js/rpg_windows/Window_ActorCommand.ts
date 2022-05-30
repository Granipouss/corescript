import { Graphics } from '../rpg_core/Graphics';
import { ConfigManager } from '../rpg_managers/ConfigManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Command } from './Window_Command';

/**
 * The window for selecting an actor's action on the battle screen.
 */
export class Window_ActorCommand extends Window_Command {
    protected _actor: Game_Actor;

    initialize() {
        const y = Graphics.boxHeight - this.windowHeight();
        super.initialize(0, y);
        this.openness = 0;
        this.deactivate();
        this._actor = null;
    }

    windowWidth(): number {
        return 192;
    }

    numVisibleRows(): number {
        return 4;
    }

    makeCommandList(): void {
        if (this._actor) {
            this.addAttackCommand();
            this.addSkillCommands();
            this.addGuardCommand();
            this.addItemCommand();
        }
    }

    addAttackCommand(): void {
        this.addCommand(TextManager.attack, 'attack', this._actor.canAttack());
    }

    addSkillCommands(): void {
        const skillTypes = this._actor.addedSkillTypes();
        skillTypes.sort((a, b) => a - b);
        skillTypes.forEach(function (stypeId) {
            const name = window.$dataSystem.skillTypes[stypeId];
            this.addCommand(name, 'skill', true, stypeId);
        }, this);
    }

    addGuardCommand(): void {
        this.addCommand(TextManager.guard, 'guard', this._actor.canGuard());
    }

    addItemCommand(): void {
        this.addCommand(TextManager.item, 'item');
    }

    setup(actor: Game_Actor): void {
        this._actor = actor;
        this.clearCommandList();
        this.makeCommandList();
        this.refresh();
        this.selectLast();
        this.activate();
        this.open();
    }

    processOk(): void {
        if (this._actor) {
            if (ConfigManager.commandRemember) {
                this._actor.setLastCommandSymbol(this.currentSymbol());
            } else {
                this._actor.setLastCommandSymbol('');
            }
        }
        super.processOk();
    }

    selectLast(): void {
        this.select(0);
        if (this._actor && ConfigManager.commandRemember) {
            const symbol = this._actor.lastCommandSymbol();
            this.selectSymbol(symbol);
            if (symbol === 'skill') {
                const skill = this._actor.lastBattleSkill();
                if (skill) {
                    this.selectExt(skill.stypeId);
                }
            }
        }
    }
}
