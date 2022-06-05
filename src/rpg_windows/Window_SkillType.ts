import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Command } from './Window_Command';
import type { Window_SkillList } from './Window_SkillList';

/**
 * The window for selecting a skill type on the skill screen.
 */
export class Window_SkillType extends Window_Command {
    protected _actor: Game_Actor = null;
    protected _skillWindow: Window_SkillList;

    windowWidth(): number {
        return 240;
    }

    setActor(actor: Game_Actor): void {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
            this.selectLast();
        }
    }

    numVisibleRows(): number {
        return 4;
    }

    makeCommandList(): void {
        if (this._actor) {
            const skillTypes = this._actor.addedSkillTypes();
            skillTypes.sort((a, b) => a - b);
            skillTypes.forEach((stypeId) => {
                const name = window.$dataSystem.skillTypes[stypeId];
                this.addCommand(name, 'skill', true, stypeId);
            });
        }
    }

    update(): void {
        super.update();
        if (this._skillWindow) {
            this._skillWindow.setStypeId(this.currentExt() as number);
        }
    }

    setSkillWindow(skillWindow: Window_SkillList): void {
        this._skillWindow = skillWindow;
    }

    selectLast(): void {
        const skill = this._actor.lastMenuSkill();
        if (skill) {
            this.selectExt(skill.stypeId);
        } else {
            this.select(0);
        }
    }
}
