import { Graphics } from '../rpg_core/Graphics';
import type { RPGItem } from '../rpg_data/item';
import { AudioManager } from '../rpg_managers/AudioManager';
import { BattleManager } from '../rpg_managers/BattleManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Spriteset_Battle } from '../rpg_sprites/Spriteset_Battle';
import { Window_ActorCommand } from '../rpg_windows/Window_ActorCommand';
import { Window_BattleActor } from '../rpg_windows/Window_BattleActor';
import { Window_BattleEnemy } from '../rpg_windows/Window_BattleEnemy';
import { Window_BattleItem } from '../rpg_windows/Window_BattleItem';
import { Window_BattleLog } from '../rpg_windows/Window_BattleLog';
import { Window_BattleSkill } from '../rpg_windows/Window_BattleSkill';
import { Window_BattleStatus } from '../rpg_windows/Window_BattleStatus';
import { Window_Help } from '../rpg_windows/Window_Help';
import { Window_Message } from '../rpg_windows/Window_Message';
import { Window_PartyCommand } from '../rpg_windows/Window_PartyCommand';
import { Window_ScrollText } from '../rpg_windows/Window_ScrollText';
import { Scene_Base } from './Scene_Base';
import { Scene_Gameover } from './Scene_Gameover';
import { Scene_Title } from './Scene_Title';

/**
 * The scene class of the battle screen.
 */
export class Scene_Battle extends Scene_Base {
    protected _partyCommandWindow: Window_PartyCommand;
    protected _actorCommandWindow: Window_ActorCommand;
    protected _skillWindow: Window_BattleSkill;
    protected _itemWindow: Window_BattleItem;
    protected _actorWindow: Window_BattleActor;
    protected _enemyWindow: Window_BattleEnemy;
    protected _statusWindow: Window_BattleStatus;
    protected _messageWindow: Window_Message;
    protected _helpWindow: Window_Help;
    protected _scrollTextWindow: Window_ScrollText;
    protected _spriteset: Spriteset_Battle;
    protected _logWindow: Window_BattleLog;

    create(): void {
        super.create();
        this.createDisplayObjects();
    }

    start(): void {
        super.start();
        this.startFadeIn(this.fadeSpeed(), false);
        BattleManager.playBattleBgm();
        BattleManager.startBattle();
    }

    update(): void {
        const active = this.isActive();
        window.$gameTimer.update(active);
        window.$gameScreen.update();
        this.updateStatusWindow();
        this.updateWindowPositions();
        if (active && !this.isBusy()) {
            this.updateBattleProcess();
        }
        super.update();
    }

    updateBattleProcess(): void {
        if (!this.isAnyInputWindowActive() || BattleManager.isAborting() || BattleManager.isBattleEnd()) {
            BattleManager.update();
            this.changeInputWindow();
        }
    }

    isAnyInputWindowActive(): boolean {
        return (
            this._partyCommandWindow.active ||
            this._actorCommandWindow.active ||
            this._skillWindow.active ||
            this._itemWindow.active ||
            this._actorWindow.active ||
            this._enemyWindow.active
        );
    }

    changeInputWindow(): void {
        if (BattleManager.isInputting()) {
            if (BattleManager.actor()) {
                this.startActorCommandSelection();
            } else {
                this.startPartyCommandSelection();
            }
        } else {
            this.endCommandSelection();
        }
    }

    stop(): void {
        super.stop();
        if (this.needsSlowFadeOut()) {
            this.startFadeOut(this.slowFadeSpeed(), false);
        } else {
            this.startFadeOut(this.fadeSpeed(), false);
        }
        this._statusWindow.close();
        this._partyCommandWindow.close();
        this._actorCommandWindow.close();
    }

    terminate(): void {
        super.terminate();
        window.$gameParty.onBattleEnd();
        window.$gameTroop.onBattleEnd();
        AudioManager.stopMe();

        ImageManager.clearRequest();
    }

    needsSlowFadeOut(): boolean {
        return SceneManager.isNextScene(Scene_Title) || SceneManager.isNextScene(Scene_Gameover);
    }

    updateStatusWindow(): void {
        if (window.$gameMessage.isBusy()) {
            this._statusWindow.close();
            this._partyCommandWindow.close();
            this._actorCommandWindow.close();
        } else if (this.isActive() && !this._messageWindow.isClosing()) {
            this._statusWindow.open();
        }
    }

    updateWindowPositions(): void {
        let statusX = 0;
        if (BattleManager.isInputting()) {
            statusX = this._partyCommandWindow.width;
        } else {
            statusX = this._partyCommandWindow.width / 2;
        }
        if (this._statusWindow.x < statusX) {
            this._statusWindow.x += 16;
            if (this._statusWindow.x > statusX) {
                this._statusWindow.x = statusX;
            }
        }
        if (this._statusWindow.x > statusX) {
            this._statusWindow.x -= 16;
            if (this._statusWindow.x < statusX) {
                this._statusWindow.x = statusX;
            }
        }
    }

    createDisplayObjects(): void {
        this.createSpriteset();
        this.createWindowLayer();
        this.createAllWindows();
        BattleManager.setLogWindow(this._logWindow);
        BattleManager.setStatusWindow(this._statusWindow);
        BattleManager.setSpriteset(this._spriteset);
        this._logWindow.setSpriteset(this._spriteset);
    }

    createSpriteset(): void {
        this._spriteset = new Spriteset_Battle();
        this.addChild(this._spriteset);
    }

    createAllWindows(): void {
        this.createLogWindow();
        this.createStatusWindow();
        this.createPartyCommandWindow();
        this.createActorCommandWindow();
        this.createHelpWindow();
        this.createSkillWindow();
        this.createItemWindow();
        this.createActorWindow();
        this.createEnemyWindow();
        this.createMessageWindow();
        this.createScrollTextWindow();
    }

    createLogWindow(): void {
        this._logWindow = new Window_BattleLog();
        this.addWindow(this._logWindow);
    }

    createStatusWindow(): void {
        this._statusWindow = new Window_BattleStatus();
        this.addWindow(this._statusWindow);
    }

    createPartyCommandWindow(): void {
        this._partyCommandWindow = new Window_PartyCommand();
        this._partyCommandWindow.setHandler('fight', this.commandFight.bind(this));
        this._partyCommandWindow.setHandler('escape', this.commandEscape.bind(this));
        this.addWindow(this._partyCommandWindow);
        this._partyCommandWindow.deselect();
    }

    createActorCommandWindow(): void {
        this._actorCommandWindow = new Window_ActorCommand();
        this._actorCommandWindow.setHandler('attack', this.commandAttack.bind(this));
        this._actorCommandWindow.setHandler('skill', this.commandSkill.bind(this));
        this._actorCommandWindow.setHandler('guard', this.commandGuard.bind(this));
        this._actorCommandWindow.setHandler('item', this.commandItem.bind(this));
        this._actorCommandWindow.setHandler('cancel', this.selectPreviousCommand.bind(this));
        this.addWindow(this._actorCommandWindow);
    }

    createHelpWindow(): void {
        this._helpWindow = new Window_Help();
        this.addWindow(this._helpWindow);
        this._helpWindow.visible = false;
    }

    createSkillWindow(): void {
        const wy = this._helpWindow.y + this._helpWindow.height;
        const wh = this._statusWindow.y - wy;
        this._skillWindow = new Window_BattleSkill(0, wy, Graphics.boxWidth, wh);
        this._skillWindow.setHelpWindow(this._helpWindow);
        this._skillWindow.setHandler('ok', this.onSkillOk.bind(this));
        this._skillWindow.setHandler('cancel', this.onSkillCancel.bind(this));
        this.addWindow(this._skillWindow);
    }

    createItemWindow(): void {
        const wy = this._helpWindow.y + this._helpWindow.height;
        const wh = this._statusWindow.y - wy;
        this._itemWindow = new Window_BattleItem(0, wy, Graphics.boxWidth, wh);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
    }

    createActorWindow(): void {
        this._actorWindow = new Window_BattleActor(0, this._statusWindow.y);
        this._actorWindow.setHandler('ok', this.onActorOk.bind(this));
        this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
        this.addWindow(this._actorWindow);
    }

    createEnemyWindow(): void {
        this._enemyWindow = new Window_BattleEnemy(0, this._statusWindow.y);
        this._enemyWindow.x = Graphics.boxWidth - this._enemyWindow.width;
        this._enemyWindow.setHandler('ok', this.onEnemyOk.bind(this));
        this._enemyWindow.setHandler('cancel', this.onEnemyCancel.bind(this));
        this.addWindow(this._enemyWindow);
    }

    createMessageWindow(): void {
        this._messageWindow = new Window_Message();
        this.addWindow(this._messageWindow);
        this._messageWindow.subWindows().forEach(function (window) {
            this.addWindow(window);
        }, this);
    }

    createScrollTextWindow(): void {
        this._scrollTextWindow = new Window_ScrollText();
        this.addWindow(this._scrollTextWindow);
    }

    refreshStatus(): void {
        this._statusWindow.refresh();
    }

    startPartyCommandSelection(): void {
        this.refreshStatus();
        this._statusWindow.deselect();
        this._statusWindow.open();
        this._actorCommandWindow.close();
        this._partyCommandWindow.setup();
    }

    commandFight(): void {
        this.selectNextCommand();
    }

    commandEscape(): void {
        BattleManager.processEscape();
        this.changeInputWindow();
    }

    startActorCommandSelection(): void {
        this._statusWindow.select(BattleManager.actor().index());
        this._partyCommandWindow.close();
        this._actorCommandWindow.setup(BattleManager.actor());
    }

    commandAttack(): void {
        BattleManager.inputtingAction().setAttack();
        this.selectEnemySelection();
    }

    commandSkill(): void {
        this._skillWindow.setActor(BattleManager.actor());
        this._skillWindow.setStypeId(this._actorCommandWindow.currentExt() as number);
        this._skillWindow.refresh();
        this._skillWindow.show();
        this._skillWindow.activate();
    }

    commandGuard(): void {
        BattleManager.inputtingAction().setGuard();
        this.selectNextCommand();
    }

    commandItem(): void {
        this._itemWindow.refresh();
        this._itemWindow.show();
        this._itemWindow.activate();
    }

    selectNextCommand(): void {
        BattleManager.selectNextCommand();
        this.changeInputWindow();
    }

    selectPreviousCommand(): void {
        BattleManager.selectPreviousCommand();
        this.changeInputWindow();
    }

    selectActorSelection(): void {
        this._actorWindow.refresh();
        this._actorWindow.show();
        this._actorWindow.activate();
    }

    onActorOk(): void {
        const action = BattleManager.inputtingAction();
        action.setTarget(this._actorWindow.index());
        this._actorWindow.hide();
        this._skillWindow.hide();
        this._itemWindow.hide();
        this.selectNextCommand();
    }

    onActorCancel(): void {
        this._actorWindow.hide();
        switch (this._actorCommandWindow.currentSymbol()) {
            case 'skill':
                this._skillWindow.show();
                this._skillWindow.activate();
                break;
            case 'item':
                this._itemWindow.show();
                this._itemWindow.activate();
                break;
        }
    }

    selectEnemySelection(): void {
        this._enemyWindow.refresh();
        this._enemyWindow.show();
        this._enemyWindow.select(0);
        this._enemyWindow.activate();
    }

    onEnemyOk(): void {
        const action = BattleManager.inputtingAction();
        action.setTarget(this._enemyWindow.enemyIndex());
        this._enemyWindow.hide();
        this._skillWindow.hide();
        this._itemWindow.hide();
        this.selectNextCommand();
    }

    onEnemyCancel(): void {
        this._enemyWindow.hide();
        switch (this._actorCommandWindow.currentSymbol()) {
            case 'attack':
                this._actorCommandWindow.activate();
                break;
            case 'skill':
                this._skillWindow.show();
                this._skillWindow.activate();
                break;
            case 'item':
                this._itemWindow.show();
                this._itemWindow.activate();
                break;
        }
    }

    onSkillOk(): void {
        const skill = this._skillWindow.item();
        const action = BattleManager.inputtingAction();
        action.setSkill(skill.id);
        BattleManager.actor().setLastBattleSkill(skill);
        this.onSelectAction();
    }

    onSkillCancel(): void {
        this._skillWindow.hide();
        this._actorCommandWindow.activate();
    }

    onItemOk(): void {
        const item = this._itemWindow.item();
        const action = BattleManager.inputtingAction();
        action.setItem(item.id);
        window.$gameParty.setLastItem(item as RPGItem);
        this.onSelectAction();
    }

    onItemCancel(): void {
        this._itemWindow.hide();
        this._actorCommandWindow.activate();
    }

    onSelectAction(): void {
        const action = BattleManager.inputtingAction();
        this._skillWindow.hide();
        this._itemWindow.hide();
        if (!action.needsSelection()) {
            this.selectNextCommand();
        } else if (action.isForOpponent()) {
            this.selectEnemySelection();
        } else {
            this.selectActorSelection();
        }
    }

    endCommandSelection(): void {
        this._partyCommandWindow.close();
        this._actorCommandWindow.close();
        this._statusWindow.deselect();
    }
}
