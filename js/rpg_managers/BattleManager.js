//-----------------------------------------------------------------------------
// BattleManager
//
// The static class that manages battle progress.

function BattleManager() {
    throw new Error('This is a static class');
}

BattleManager.setup = function (troopId, canEscape, canLose) {
    this.initMembers();
    this._canEscape = canEscape;
    this._canLose = canLose;
    global.$gameTroop.setup(troopId);
    global.$gameScreen.onBattleStart();
    this.makeEscapeRatio();
};

BattleManager.initMembers = function () {
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
};

BattleManager.isBattleTest = function () {
    return this._battleTest;
};

BattleManager.setBattleTest = function (battleTest) {
    this._battleTest = battleTest;
};

BattleManager.setEventCallback = function (callback) {
    this._eventCallback = callback;
};

BattleManager.setLogWindow = function (logWindow) {
    this._logWindow = logWindow;
};

BattleManager.setStatusWindow = function (statusWindow) {
    this._statusWindow = statusWindow;
};

BattleManager.setSpriteset = function (spriteset) {
    this._spriteset = spriteset;
};

BattleManager.onEncounter = function () {
    this._preemptive = Math.random() < this.ratePreemptive();
    this._surprise = Math.random() < this.rateSurprise() && !this._preemptive;
};

BattleManager.ratePreemptive = function () {
    return global.$gameParty.ratePreemptive(global.$gameTroop.agility());
};

BattleManager.rateSurprise = function () {
    return global.$gameParty.rateSurprise(global.$gameTroop.agility());
};

BattleManager.saveBgmAndBgs = function () {
    this._mapBgm = AudioManager.saveBgm();
    this._mapBgs = AudioManager.saveBgs();
};

BattleManager.playBattleBgm = function () {
    AudioManager.playBgm(global.$gameSystem.battleBgm());
    AudioManager.stopBgs();
};

BattleManager.playVictoryMe = function () {
    AudioManager.playMe(global.$gameSystem.victoryMe());
};

BattleManager.playDefeatMe = function () {
    AudioManager.playMe(global.$gameSystem.defeatMe());
};

BattleManager.replayBgmAndBgs = function () {
    if (this._mapBgm) {
        AudioManager.replayBgm(this._mapBgm);
    } else {
        AudioManager.stopBgm();
    }
    if (this._mapBgs) {
        AudioManager.replayBgs(this._mapBgs);
    }
};

BattleManager.makeEscapeRatio = function () {
    this._escapeRatio = (0.5 * global.$gameParty.agility()) / global.$gameTroop.agility();
};

BattleManager.update = function () {
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
};

BattleManager.updateEvent = function () {
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
};

BattleManager.updateEventMain = function () {
    global.$gameTroop.updateInterpreter();
    global.$gameParty.requestMotionRefresh();
    if (global.$gameTroop.isEventRunning() || this.checkBattleEnd()) {
        return true;
    }
    global.$gameTroop.setupBattleEvent();
    if (global.$gameTroop.isEventRunning() || SceneManager.isSceneChanging()) {
        return true;
    }
    return false;
};

BattleManager.isBusy = function () {
    return global.$gameMessage.isBusy() || this._spriteset.isBusy() || this._logWindow.isBusy();
};

BattleManager.isInputting = function () {
    return this._phase === 'input';
};

BattleManager.isInTurn = function () {
    return this._phase === 'turn';
};

BattleManager.isTurnEnd = function () {
    return this._phase === 'turnEnd';
};

BattleManager.isAborting = function () {
    return this._phase === 'aborting';
};

BattleManager.isBattleEnd = function () {
    return this._phase === 'battleEnd';
};

BattleManager.canEscape = function () {
    return this._canEscape;
};

BattleManager.canLose = function () {
    return this._canLose;
};

BattleManager.isEscaped = function () {
    return this._escaped;
};

BattleManager.actor = function () {
    return this._actorIndex >= 0 ? global.$gameParty.members()[this._actorIndex] : null;
};

BattleManager.clearActor = function () {
    this.changeActor(-1, '');
};

BattleManager.changeActor = function (newActorIndex, lastActorActionState) {
    var lastActor = this.actor();
    this._actorIndex = newActorIndex;
    var newActor = this.actor();
    if (lastActor) {
        lastActor.setActionState(lastActorActionState);
    }
    if (newActor) {
        newActor.setActionState('inputting');
    }
};

BattleManager.startBattle = function () {
    this._phase = 'start';
    global.$gameSystem.onBattleStart();
    global.$gameParty.onBattleStart();
    global.$gameTroop.onBattleStart();
    this.displayStartMessages();
};

BattleManager.displayStartMessages = function () {
    global.$gameTroop.enemyNames().forEach(function (name) {
        global.$gameMessage.add(TextManager.emerge.format(name));
    });
    if (this._preemptive) {
        global.$gameMessage.add(TextManager.preemptive.format(global.$gameParty.name()));
    } else if (this._surprise) {
        global.$gameMessage.add(TextManager.surprise.format(global.$gameParty.name()));
    }
};

BattleManager.startInput = function () {
    this._phase = 'input';
    global.$gameParty.makeActions();
    global.$gameTroop.makeActions();
    this.clearActor();
    if (this._surprise || !global.$gameParty.canInput()) {
        this.startTurn();
    }
};

BattleManager.inputtingAction = function () {
    var actor = this.actor();
    return actor ? actor.inputtingAction() : null;
};

BattleManager.selectNextCommand = function () {
    do {
        var actor = this.actor();
        if (!actor || !actor.selectNextCommand()) {
            this.changeActor(this._actorIndex + 1, 'waiting');
            if (this._actorIndex >= global.$gameParty.size()) {
                this.startTurn();
                break;
            }
        }
    } while (!this.actor().canInput());
};

BattleManager.selectPreviousCommand = function () {
    do {
        var actor = this.actor();
        if (!actor || !actor.selectPreviousCommand()) {
            this.changeActor(this._actorIndex - 1, 'undecided');
            if (this._actorIndex < 0) {
                return;
            }
        }
    } while (!this.actor().canInput());
};

BattleManager.refreshStatus = function () {
    this._statusWindow.refresh();
};

BattleManager.startTurn = function () {
    this._phase = 'turn';
    this.clearActor();
    global.$gameTroop.increaseTurn();
    this.makeActionOrders();
    global.$gameParty.requestMotionRefresh();
    this._logWindow.startTurn();
};

BattleManager.updateTurn = function () {
    global.$gameParty.requestMotionRefresh();
    if (!this._subject) {
        this._subject = this.getNextSubject();
    }
    if (this._subject) {
        this.processTurn();
    } else {
        this.endTurn();
    }
};

BattleManager.processTurn = function () {
    var subject = this._subject;
    var action = subject.currentAction();
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
};

BattleManager.endTurn = function () {
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
};

BattleManager.isForcedTurn = function () {
    return this._turnForced;
};

BattleManager.updateTurnEnd = function () {
    this.startInput();
};

BattleManager.getNextSubject = function () {
    for (;;) {
        var battler = this._actionBattlers.shift();
        if (!battler) {
            return null;
        }
        if (battler.isBattleMember() && battler.isAlive()) {
            return battler;
        }
    }
};

BattleManager.allBattleMembers = function () {
    return global.$gameParty.members().concat(global.$gameTroop.members());
};

BattleManager.makeActionOrders = function () {
    var battlers = [];
    if (!this._surprise) {
        battlers = battlers.concat(global.$gameParty.members());
    }
    if (!this._preemptive) {
        battlers = battlers.concat(global.$gameTroop.members());
    }
    battlers.forEach(function (battler) {
        battler.makeSpeed();
    });
    battlers.sort(function (a, b) {
        return b.speed() - a.speed();
    });
    this._actionBattlers = battlers;
};

BattleManager.startAction = function () {
    var subject = this._subject;
    var action = subject.currentAction();
    var targets = action.makeTargets();
    this._phase = 'action';
    this._action = action;
    this._targets = targets;
    subject.useItem(action.item());
    this._action.applyGlobal();
    this.refreshStatus();
    this._logWindow.startAction(subject, action, targets);
};

BattleManager.updateAction = function () {
    var target = this._targets.shift();
    if (target) {
        this.invokeAction(this._subject, target);
    } else {
        this.endAction();
    }
};

BattleManager.endAction = function () {
    this._logWindow.endAction(this._subject);
    this._phase = 'turn';
};

BattleManager.invokeAction = function (subject, target) {
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
};

BattleManager.invokeNormalAction = function (subject, target) {
    var realTarget = this.applySubstitute(target);
    this._action.apply(realTarget);
    this._logWindow.displayActionResults(subject, realTarget);
};

BattleManager.invokeCounterAttack = function (subject, target) {
    var action = new Game_Action(target);
    action.setAttack();
    action.apply(subject);
    this._logWindow.displayCounter(target);
    this._logWindow.displayActionResults(target, subject);
};

BattleManager.invokeMagicReflection = function (subject, target) {
    this._action._reflectionTarget = target;
    this._logWindow.displayReflection(target);
    this._action.apply(subject);
    this._logWindow.displayActionResults(target, subject);
};

BattleManager.applySubstitute = function (target) {
    if (this.checkSubstitute(target)) {
        var substitute = target.friendsUnit().substituteBattler();
        if (substitute && target !== substitute) {
            this._logWindow.displaySubstitute(substitute, target);
            return substitute;
        }
    }
    return target;
};

BattleManager.checkSubstitute = function (target) {
    return target.isDying() && !this._action.isCertainHit();
};

BattleManager.isActionForced = function () {
    return !!this._actionForcedBattler;
};

BattleManager.forceAction = function (battler) {
    this._actionForcedBattler = battler;
    var index = this._actionBattlers.indexOf(battler);
    if (index >= 0) {
        this._actionBattlers.splice(index, 1);
    }
};

BattleManager.processForcedAction = function () {
    if (this._actionForcedBattler) {
        this._turnForced = true;
        this._subject = this._actionForcedBattler;
        this._actionForcedBattler = null;
        this.startAction();
        this._subject.removeCurrentAction();
    }
};

BattleManager.abort = function () {
    this._phase = 'aborting';
};

BattleManager.checkBattleEnd = function () {
    if (this._phase) {
        if (this.checkAbort()) {
            return true;
        } else if (global.$gameParty.isAllDead()) {
            this.processDefeat();
            return true;
        } else if (global.$gameTroop.isAllDead()) {
            this.processVictory();
            return true;
        }
    }
    return false;
};

BattleManager.checkAbort = function () {
    if (global.$gameParty.isEmpty() || this.isAborting()) {
        SoundManager.playEscape();
        this._escaped = true;
        this.processAbort();
    }
    return false;
};

BattleManager.processVictory = function () {
    global.$gameParty.removeBattleStates();
    global.$gameParty.performVictory();
    this.playVictoryMe();
    this.replayBgmAndBgs();
    this.makeRewards();
    this.displayVictoryMessage();
    this.displayRewards();
    this.gainRewards();
    this.endBattle(0);
};

BattleManager.processEscape = function () {
    global.$gameParty.performEscape();
    SoundManager.playEscape();
    var success = this._preemptive ? true : Math.random() < this._escapeRatio;
    if (success) {
        this.displayEscapeSuccessMessage();
        this._escaped = true;
        this.processAbort();
    } else {
        this.displayEscapeFailureMessage();
        this._escapeRatio += 0.1;
        global.$gameParty.clearActions();
        this.startTurn();
    }
    return success;
};

BattleManager.processAbort = function () {
    global.$gameParty.removeBattleStates();
    this.replayBgmAndBgs();
    this.endBattle(1);
};

BattleManager.processDefeat = function () {
    this.displayDefeatMessage();
    this.playDefeatMe();
    if (this._canLose) {
        this.replayBgmAndBgs();
    } else {
        AudioManager.stopBgm();
    }
    this.endBattle(2);
};

BattleManager.endBattle = function (result) {
    this._phase = 'battleEnd';
    if (this._eventCallback) {
        this._eventCallback(result);
    }
    if (result === 0) {
        global.$gameSystem.onBattleWin();
    } else if (this._escaped) {
        global.$gameSystem.onBattleEscape();
    }
};

BattleManager.updateBattleEnd = function () {
    if (this.isBattleTest()) {
        AudioManager.stopBgm();
        SceneManager.exit();
    } else if (!this._escaped && global.$gameParty.isAllDead()) {
        if (this._canLose) {
            global.$gameParty.reviveBattleMembers();
            SceneManager.pop();
        } else {
            SceneManager.goto(Scene_Gameover);
        }
    } else {
        SceneManager.pop();
    }
    this._phase = null;
};

BattleManager.makeRewards = function () {
    this._rewards = {};
    this._rewards.gold = global.$gameTroop.goldTotal();
    this._rewards.exp = global.$gameTroop.expTotal();
    this._rewards.items = global.$gameTroop.makeDropItems();
};

BattleManager.displayVictoryMessage = function () {
    global.$gameMessage.add(TextManager.victory.format(global.$gameParty.name()));
};

BattleManager.displayDefeatMessage = function () {
    global.$gameMessage.add(TextManager.defeat.format(global.$gameParty.name()));
};

BattleManager.displayEscapeSuccessMessage = function () {
    global.$gameMessage.add(TextManager.escapeStart.format(global.$gameParty.name()));
};

BattleManager.displayEscapeFailureMessage = function () {
    global.$gameMessage.add(TextManager.escapeStart.format(global.$gameParty.name()));
    global.$gameMessage.add('\\.' + TextManager.escapeFailure);
};

BattleManager.displayRewards = function () {
    this.displayExp();
    this.displayGold();
    this.displayDropItems();
};

BattleManager.displayExp = function () {
    var exp = this._rewards.exp;
    if (exp > 0) {
        var text = TextManager.obtainExp.format(exp, TextManager.exp);
        global.$gameMessage.add('\\.' + text);
    }
};

BattleManager.displayGold = function () {
    var gold = this._rewards.gold;
    if (gold > 0) {
        global.$gameMessage.add('\\.' + TextManager.obtainGold.format(gold));
    }
};

BattleManager.displayDropItems = function () {
    var items = this._rewards.items;
    if (items.length > 0) {
        global.$gameMessage.newPage();
        items.forEach(function (item) {
            global.$gameMessage.add(TextManager.obtainItem.format(item.name));
        });
    }
};

BattleManager.gainRewards = function () {
    this.gainExp();
    this.gainGold();
    this.gainDropItems();
};

BattleManager.gainExp = function () {
    var exp = this._rewards.exp;
    global.$gameParty.allMembers().forEach(function (actor) {
        actor.gainExp(exp);
    });
};

BattleManager.gainGold = function () {
    global.$gameParty.gainGold(this._rewards.gold);
};

BattleManager.gainDropItems = function () {
    var items = this._rewards.items;
    items.forEach(function (item) {
        global.$gameParty.gainItem(item, 1);
    });
};
