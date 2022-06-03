import { format } from '../rpg_core/extension';
import type { RPGArmor } from '../rpg_data/armor';
import type { AudioFile } from '../rpg_data/audio-file';
import type { RPGItem } from '../rpg_data/item';
import type { RPGWeapon } from '../rpg_data/weapon';
import { Game_Action } from '../rpg_objects/Game_Action';
import type { Game_Actor } from '../rpg_objects/Game_Actor';
import type { Game_Battler } from '../rpg_objects/Game_Battler';
import { Scene_Gameover } from '../rpg_scenes/Scene_Gameover';
import type { Spriteset_Battle } from '../rpg_sprites/Spriteset_Battle';
import type { Window_BattleLog } from '../rpg_windows/Window_BattleLog';
import type { Window_BattleStatus } from '../rpg_windows/Window_BattleStatus';
import { AudioManager } from './AudioManager';
import { SceneManager } from './SceneManager';
import { SoundManager } from './SoundManager';
import { TextManager } from './TextManager';

/**
 * The static class that manages battle progress.
 */
export const BattleManager = new (class BattleManager {
    private _canEscape: boolean;
    private _canLose: boolean;
    private _phase: string;
    private _battleTest: boolean;
    private _eventCallback: (result: number) => void;
    private _preemptive: boolean;
    private _surprise: boolean;
    private _actorIndex: number;
    private _actionForcedBattler: Game_Battler;
    private _mapBgm: AudioFile;
    private _mapBgs: AudioFile;
    private _actionBattlers: Game_Battler[];
    private _subject: Game_Battler;
    private _action: Game_Action;
    private _targets: Game_Battler[];
    private _logWindow: Window_BattleLog;
    private _statusWindow: Window_BattleStatus;
    private _spriteset: Spriteset_Battle;
    private _escapeRatio: number;
    private _escaped: boolean;
    private _rewards: { gold?: number; exp?: number; items?: (RPGArmor | RPGWeapon | RPGItem)[] };
    private _turnForced: boolean;

    setup(troopId: number, canEscape = true, canLose = true): void {
        this.initMembers();
        this._canEscape = canEscape;
        this._canLose = canLose;
        window.$gameTroop.setup(troopId);
        window.$gameScreen.onBattleStart();
        this.makeEscapeRatio();
    }

    initMembers(): void {
        this._phase = 'init';
        this._canEscape = false;
        this._canLose = false;
        this._battleTest = false;
        this._eventCallback = null;
        this._preemptive = false;
        this._surprise = false;
        this._actorIndex = -1;
        this._actionForcedBattler = null;
        this._mapBgm = null;
        this._mapBgs = null;
        this._actionBattlers = [];
        this._subject = null;
        this._action = null;
        this._targets = [];
        this._logWindow = null;
        this._statusWindow = null;
        this._spriteset = null;
        this._escapeRatio = 0;
        this._escaped = false;
        this._rewards = {};
        this._turnForced = false;
    }

    isBattleTest(): boolean {
        return this._battleTest;
    }

    setBattleTest(battleTest: boolean): void {
        this._battleTest = battleTest;
    }

    setEventCallback(callback: (result: number) => void): void {
        this._eventCallback = callback;
    }

    setLogWindow(logWindow: Window_BattleLog): void {
        this._logWindow = logWindow;
    }

    setStatusWindow(statusWindow: Window_BattleStatus): void {
        this._statusWindow = statusWindow;
    }

    setSpriteset(spriteset: Spriteset_Battle): void {
        this._spriteset = spriteset;
    }

    onEncounter(): void {
        this._preemptive = Math.random() < this.ratePreemptive();
        this._surprise = Math.random() < this.rateSurprise() && !this._preemptive;
    }

    ratePreemptive(): number {
        return window.$gameParty.ratePreemptive(window.$gameTroop.agility());
    }

    rateSurprise(): number {
        return window.$gameParty.rateSurprise(window.$gameTroop.agility());
    }

    saveBgmAndBgs(): void {
        this._mapBgm = AudioManager.saveBgm();
        this._mapBgs = AudioManager.saveBgs();
    }

    playBattleBgm(): void {
        AudioManager.playBgm(window.$gameSystem.battleBgm());
        AudioManager.stopBgs();
    }

    playVictoryMe(): void {
        AudioManager.playMe(window.$gameSystem.victoryMe());
    }

    playDefeatMe(): void {
        AudioManager.playMe(window.$gameSystem.defeatMe());
    }

    replayBgmAndBgs(): void {
        if (this._mapBgm) {
            AudioManager.replayBgm(this._mapBgm);
        } else {
            AudioManager.stopBgm();
        }
        if (this._mapBgs) {
            AudioManager.replayBgs(this._mapBgs);
        }
    }

    makeEscapeRatio(): void {
        this._escapeRatio = (0.5 * window.$gameParty.agility()) / window.$gameTroop.agility();
    }

    update(): void {
        if (!this.isBusy() && !this.updateEvent()) {
            switch (this._phase) {
                case 'start':
                    this.startInput();
                    break;
                case 'turn':
                    this.updateTurn();
                    break;
                case 'action':
                    this.updateAction();
                    break;
                case 'turnEnd':
                    this.updateTurnEnd();
                    break;
                case 'battleEnd':
                    this.updateBattleEnd();
                    break;
            }
        }
    }

    updateEvent(): boolean {
        switch (this._phase) {
            case 'start':
            case 'turn':
            case 'turnEnd':
                if (this.isActionForced()) {
                    this.processForcedAction();
                    return true;
                } else {
                    return this.updateEventMain();
                }
        }
        return this.checkAbort();
    }

    updateEventMain(): boolean {
        window.$gameTroop.updateInterpreter();
        window.$gameParty.requestMotionRefresh();
        if (window.$gameTroop.isEventRunning() || this.checkBattleEnd()) {
            return true;
        }
        window.$gameTroop.setupBattleEvent();
        if (window.$gameTroop.isEventRunning() || SceneManager.isSceneChanging()) {
            return true;
        }
        return false;
    }

    isBusy(): boolean {
        return window.$gameMessage.isBusy() || this._spriteset.isBusy() || this._logWindow.isBusy();
    }

    isInputting(): boolean {
        return this._phase === 'input';
    }

    isInTurn(): boolean {
        return this._phase === 'turn';
    }

    isTurnEnd(): boolean {
        return this._phase === 'turnEnd';
    }

    isAborting(): boolean {
        return this._phase === 'aborting';
    }

    isBattleEnd(): boolean {
        return this._phase === 'battleEnd';
    }

    canEscape(): boolean {
        return this._canEscape;
    }

    canLose(): boolean {
        return this._canLose;
    }

    isEscaped(): boolean {
        return this._escaped;
    }

    actor(): Game_Actor {
        return this._actorIndex >= 0 ? window.$gameParty.members()[this._actorIndex] : null;
    }

    clearActor(): void {
        this.changeActor(-1, '');
    }

    changeActor(newActorIndex: number, lastActorActionState: string): void {
        const lastActor = this.actor();
        this._actorIndex = newActorIndex;
        const newActor = this.actor();
        if (lastActor) {
            lastActor.setActionState(lastActorActionState);
        }
        if (newActor) {
            newActor.setActionState('inputting');
        }
    }

    startBattle(): void {
        this._phase = 'start';
        window.$gameSystem.onBattleStart();
        window.$gameParty.onBattleStart();
        window.$gameTroop.onBattleStart();
        this.displayStartMessages();
    }

    displayStartMessages(): void {
        window.$gameTroop.enemyNames().forEach((name) => {
            window.$gameMessage.add(format(TextManager.emerge, name));
        });
        if (this._preemptive) {
            window.$gameMessage.add(format(TextManager.preemptive, window.$gameParty.name()));
        } else if (this._surprise) {
            window.$gameMessage.add(format(TextManager.surprise, window.$gameParty.name()));
        }
    }

    startInput(): void {
        this._phase = 'input';
        window.$gameParty.makeActions();
        window.$gameTroop.makeActions();
        this.clearActor();
        if (this._surprise || !window.$gameParty.canInput()) {
            this.startTurn();
        }
    }

    inputtingAction(): Game_Action {
        const actor = this.actor();
        return actor ? actor.inputtingAction() : null;
    }

    selectNextCommand(): void {
        do {
            const actor = this.actor();
            if (!actor || !actor.selectNextCommand()) {
                this.changeActor(this._actorIndex + 1, 'waiting');
                if (this._actorIndex >= window.$gameParty.size()) {
                    this.startTurn();
                    break;
                }
            }
        } while (!this.actor().canInput());
    }

    selectPreviousCommand(): void {
        do {
            const actor = this.actor();
            if (!actor || !actor.selectPreviousCommand()) {
                this.changeActor(this._actorIndex - 1, 'undecided');
                if (this._actorIndex < 0) {
                    return;
                }
            }
        } while (!this.actor().canInput());
    }

    refreshStatus(): void {
        this._statusWindow.refresh();
    }

    startTurn(): void {
        this._phase = 'turn';
        this.clearActor();
        window.$gameTroop.increaseTurn();
        this.makeActionOrders();
        window.$gameParty.requestMotionRefresh();
        this._logWindow.startTurn();
    }

    updateTurn(): void {
        window.$gameParty.requestMotionRefresh();
        if (!this._subject) {
            this._subject = this.getNextSubject();
        }
        if (this._subject) {
            this.processTurn();
        } else {
            this.endTurn();
        }
    }

    processTurn(): void {
        const subject = this._subject;
        const action = subject.currentAction();
        if (action) {
            action.prepare();
            if (action.isValid()) {
                this.startAction();
            }
            subject.removeCurrentAction();
        } else {
            subject.onAllActionsEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(subject);
            this._logWindow.displayCurrentState(subject);
            this._logWindow.displayRegeneration(subject);
            this._subject = this.getNextSubject();
        }
    }

    endTurn(): void {
        this._phase = 'turnEnd';
        this._preemptive = false;
        this._surprise = false;
        this.allBattleMembers().forEach(function (battler) {
            battler.onTurnEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(battler);
            this._logWindow.displayRegeneration(battler);
        }, this);
        if (this.isForcedTurn()) {
            this._turnForced = false;
        }
    }

    isForcedTurn(): boolean {
        return this._turnForced;
    }

    updateTurnEnd(): void {
        this.startInput();
    }

    getNextSubject(): Game_Battler {
        for (;;) {
            const battler = this._actionBattlers.shift();
            if (!battler) {
                return null;
            }
            if (battler.isBattleMember() && battler.isAlive()) {
                return battler;
            }
        }
    }

    allBattleMembers(): Game_Battler[] {
        return [...window.$gameParty.members(), ...window.$gameTroop.members()];
    }

    makeActionOrders(): void {
        let battlers: Game_Battler[] = [];
        if (!this._surprise) {
            battlers = battlers.concat(window.$gameParty.members());
        }
        if (!this._preemptive) {
            battlers = battlers.concat(window.$gameTroop.members());
        }
        battlers.forEach((battler) => {
            battler.makeSpeed();
        });
        battlers.sort((a, b) => b.speed() - a.speed());
        this._actionBattlers = battlers;
    }

    startAction(): void {
        const subject = this._subject;
        const action = subject.currentAction();
        const targets = action.makeTargets();
        this._phase = 'action';
        this._action = action;
        this._targets = targets;
        subject.useItem(action.item());
        this._action.applyGlobal();
        this.refreshStatus();
        this._logWindow.startAction(subject, action, targets);
    }

    updateAction(): void {
        const target = this._targets.shift();
        if (target) {
            this.invokeAction(this._subject, target);
        } else {
            this.endAction();
        }
    }

    endAction(): void {
        this._logWindow.endAction(this._subject);
        this._phase = 'turn';
    }

    invokeAction(subject: Game_Battler, target: Game_Battler): void {
        this._logWindow.push('pushBaseLine');
        if (Math.random() < this._action.itemCnt(target)) {
            this.invokeCounterAttack(subject, target);
        } else if (Math.random() < this._action.itemMrf(target)) {
            this.invokeMagicReflection(subject, target);
        } else {
            this.invokeNormalAction(subject, target);
        }
        subject.setLastTarget(target);
        this._logWindow.push('popBaseLine');
        this.refreshStatus();
    }

    invokeNormalAction(subject: Game_Battler, target: Game_Battler): void {
        const realTarget = this.applySubstitute(target);
        this._action.apply(realTarget);
        this._logWindow.displayActionResults(subject, realTarget);
    }

    invokeCounterAttack(subject: Game_Battler, target: Game_Battler): void {
        const action = new Game_Action(target);
        action.setAttack();
        action.apply(subject);
        this._logWindow.displayCounter(target);
        this._logWindow.displayActionResults(target, subject);
    }

    invokeMagicReflection(subject: Game_Battler, target: Game_Battler): void {
        this._action._reflectionTarget = target;
        this._logWindow.displayReflection(target);
        this._action.apply(subject);
        this._logWindow.displayActionResults(target, subject);
    }

    applySubstitute(target: Game_Battler): Game_Battler {
        if (this.checkSubstitute(target)) {
            const substitute = target.friendsUnit().substituteBattler();
            if (substitute && target !== substitute) {
                this._logWindow.displaySubstitute(substitute, target);
                return substitute;
            }
        }
        return target;
    }

    checkSubstitute(target: Game_Battler): boolean {
        return target.isDying() && !this._action.isCertainHit();
    }

    isActionForced(): boolean {
        return !!this._actionForcedBattler;
    }

    forceAction(battler: Game_Battler): void {
        this._actionForcedBattler = battler;
        const index = this._actionBattlers.indexOf(battler);
        if (index >= 0) {
            this._actionBattlers.splice(index, 1);
        }
    }

    processForcedAction(): void {
        if (this._actionForcedBattler) {
            this._turnForced = true;
            this._subject = this._actionForcedBattler;
            this._actionForcedBattler = null;
            this.startAction();
            this._subject.removeCurrentAction();
        }
    }

    abort(): void {
        this._phase = 'aborting';
    }

    checkBattleEnd(): boolean {
        if (this._phase) {
            if (this.checkAbort()) {
                return true;
            } else if (window.$gameParty.isAllDead()) {
                this.processDefeat();
                return true;
            } else if (window.$gameTroop.isAllDead()) {
                this.processVictory();
                return true;
            }
        }
        return false;
    }

    checkAbort(): boolean {
        if (window.$gameParty.isEmpty() || this.isAborting()) {
            SoundManager.playEscape();
            this._escaped = true;
            this.processAbort();
        }
        return false;
    }

    processVictory(): void {
        window.$gameParty.removeBattleStates();
        window.$gameParty.performVictory();
        this.playVictoryMe();
        this.replayBgmAndBgs();
        this.makeRewards();
        this.displayVictoryMessage();
        this.displayRewards();
        this.gainRewards();
        this.endBattle(0);
    }

    processEscape(): boolean {
        window.$gameParty.performEscape();
        SoundManager.playEscape();
        const success = this._preemptive ? true : Math.random() < this._escapeRatio;
        if (success) {
            this.displayEscapeSuccessMessage();
            this._escaped = true;
            this.processAbort();
        } else {
            this.displayEscapeFailureMessage();
            this._escapeRatio += 0.1;
            window.$gameParty.clearActions();
            this.startTurn();
        }
        return success;
    }

    processAbort(): void {
        window.$gameParty.removeBattleStates();
        this.replayBgmAndBgs();
        this.endBattle(1);
    }

    processDefeat(): void {
        this.displayDefeatMessage();
        this.playDefeatMe();
        if (this._canLose) {
            this.replayBgmAndBgs();
        } else {
            AudioManager.stopBgm();
        }
        this.endBattle(2);
    }

    endBattle(result: number): void {
        this._phase = 'battleEnd';
        if (this._eventCallback) {
            this._eventCallback(result);
        }
        if (result === 0) {
            window.$gameSystem.onBattleWin();
        } else if (this._escaped) {
            window.$gameSystem.onBattleEscape();
        }
    }

    updateBattleEnd(): void {
        if (this.isBattleTest()) {
            AudioManager.stopBgm();
            SceneManager.exit();
        } else if (!this._escaped && window.$gameParty.isAllDead()) {
            if (this._canLose) {
                window.$gameParty.reviveBattleMembers();
                SceneManager.pop();
            } else {
                SceneManager.goto(Scene_Gameover);
            }
        } else {
            SceneManager.pop();
        }
        this._phase = null;
    }

    makeRewards(): void {
        this._rewards = {};
        this._rewards.gold = window.$gameTroop.goldTotal();
        this._rewards.exp = window.$gameTroop.expTotal();
        this._rewards.items = window.$gameTroop.makeDropItems();
    }

    displayVictoryMessage(): void {
        window.$gameMessage.add(format(TextManager.victory, window.$gameParty.name()));
    }

    displayDefeatMessage(): void {
        window.$gameMessage.add(format(TextManager.defeat, window.$gameParty.name()));
    }

    displayEscapeSuccessMessage(): void {
        window.$gameMessage.add(format(TextManager.escapeStart, window.$gameParty.name()));
    }

    displayEscapeFailureMessage(): void {
        window.$gameMessage.add(format(TextManager.escapeStart, window.$gameParty.name()));
        window.$gameMessage.add('\\.' + TextManager.escapeFailure);
    }

    displayRewards(): void {
        this.displayExp();
        this.displayGold();
        this.displayDropItems();
    }

    displayExp(): void {
        const exp = this._rewards.exp;
        if (exp > 0) {
            const text = format(TextManager.obtainExp, exp, TextManager.exp);
            window.$gameMessage.add('\\.' + text);
        }
    }

    displayGold(): void {
        const gold = this._rewards.gold;
        if (gold > 0) {
            window.$gameMessage.add('\\.' + format(TextManager.obtainGold, gold));
        }
    }

    displayDropItems(): void {
        const items = this._rewards.items;
        if (items.length > 0) {
            window.$gameMessage.newPage();
            items.forEach((item) => {
                window.$gameMessage.add(format(TextManager.obtainItem, item.name));
            });
        }
    }

    gainRewards(): void {
        this.gainExp();
        this.gainGold();
        this.gainDropItems();
    }

    gainExp(): void {
        const exp = this._rewards.exp;
        window.$gameParty.allMembers().forEach((actor) => {
            actor.gainExp(exp);
        });
    }

    gainGold(): void {
        window.$gameParty.gainGold(this._rewards.gold);
    }

    gainDropItems(): void {
        const items = this._rewards.items;
        items.forEach((item) => {
            window.$gameParty.gainItem(item, 1);
        });
    }
})();
