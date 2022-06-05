import { Window_SkillList } from './Window_SkillList';

/**
 * The window for selecting a skill to use on the battle screen.
 */
export class Window_BattleSkill extends Window_SkillList {
    initialize(x: number, y: number, width: number, height: number): void {
        super.initialize(x, y, width, height);
        this.hide();
    }

    show(): void {
        this.selectLast();
        this.showHelpWindow();
        super.show();
    }

    hide(): void {
        this.hideHelpWindow();
        super.hide();
    }
}
