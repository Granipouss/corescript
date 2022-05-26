import { Bitmap } from '../rpg_core/Bitmap';
import { arrayClone, format } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { Sprite } from '../rpg_core/Sprite';
import { TouchInput } from '../rpg_core/TouchInput';
import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for displaying battle progress. No frame is displayed, but it is
 * handled as a window for convenience.
 */
export class Window_BattleLog extends Window_Selectable {
    initialize() {
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(0, 0, width, height);
        this.opacity = 0;
        this._lines = [];
        this._methods = [];
        this._waitCount = 0;
        this._waitMode = '';
        this._baseLineStack = [];
        this._spriteset = null;
        this.createBackBitmap();
        this.createBackSprite();
        this.refresh();
    }

    setSpriteset(spriteset) {
        this._spriteset = spriteset;
    }

    windowWidth() {
        return Graphics.boxWidth;
    }

    windowHeight() {
        return this.fittingHeight(this.maxLines());
    }

    maxLines() {
        return 10;
    }

    createBackBitmap() {
        this._backBitmap = new Bitmap(this.width, this.height);
    }

    createBackSprite() {
        this._backSprite = new Sprite();
        this._backSprite.bitmap = this._backBitmap;
        this._backSprite.y = this.y;
        this.addChildToBack(this._backSprite);
    }

    numLines() {
        return this._lines.length;
    }

    messageSpeed() {
        return 16;
    }

    isBusy() {
        return this._waitCount > 0 || this._waitMode || this._methods.length > 0;
    }

    update() {
        if (!this.updateWait()) {
            this.callNextMethod();
        }
    }

    updateWait() {
        return this.updateWaitCount() || this.updateWaitMode();
    }

    updateWaitCount() {
        if (this._waitCount > 0) {
            this._waitCount -= this.isFastForward() ? 3 : 1;
            if (this._waitCount < 0) {
                this._waitCount = 0;
            }
            return true;
        }
        return false;
    }

    updateWaitMode() {
        let waiting = false;
        switch (this._waitMode) {
            case 'effect':
                waiting = this._spriteset.isEffecting();
                break;
            case 'movement':
                waiting = this._spriteset.isAnyoneMoving();
                break;
        }
        if (!waiting) {
            this._waitMode = '';
        }
        return waiting;
    }

    setWaitMode(waitMode) {
        this._waitMode = waitMode;
    }

    callNextMethod() {
        if (this._methods.length > 0) {
            const method = this._methods.shift();
            if (method.name && this[method.name]) {
                this[method.name].apply(this, method.params);
            } else {
                throw new Error('Method not found: ' + method.name);
            }
        }
    }

    isFastForward() {
        return Input.isLongPressed('ok') || Input.isPressed('shift') || TouchInput.isLongPressed();
    }

    push(methodName, ...methodArgs) {
        this._methods.push({ name: methodName, params: methodArgs });
    }

    clear() {
        this._lines = [];
        this._baseLineStack = [];
        this.refresh();
    }

    wait() {
        this._waitCount = this.messageSpeed();
    }

    waitForEffect() {
        this.setWaitMode('effect');
    }

    waitForMovement() {
        this.setWaitMode('movement');
    }

    addText(text) {
        this._lines.push(text);
        this.refresh();
        this.wait();
    }

    pushBaseLine() {
        this._baseLineStack.push(this._lines.length);
    }

    popBaseLine() {
        const baseLine = this._baseLineStack.pop();
        while (this._lines.length > baseLine) {
            this._lines.pop();
        }
    }

    waitForNewLine() {
        let baseLine = 0;
        if (this._baseLineStack.length > 0) {
            baseLine = this._baseLineStack[this._baseLineStack.length - 1];
        }
        if (this._lines.length > baseLine) {
            this.wait();
        }
    }

    popupDamage(target) {
        target.startDamagePopup();
    }

    performActionStart(subject, action) {
        subject.performActionStart(action);
    }

    performAction(subject, action) {
        subject.performAction(action);
    }

    performActionEnd(subject) {
        subject.performActionEnd();
    }

    performDamage(target) {
        target.performDamage();
    }

    performMiss(target) {
        target.performMiss();
    }

    performRecovery(target) {
        target.performRecovery();
    }

    performEvasion(target) {
        target.performEvasion();
    }

    performMagicEvasion(target) {
        target.performMagicEvasion();
    }

    performCounter(target) {
        target.performCounter();
    }

    performReflection(target) {
        target.performReflection();
    }

    performSubstitute(substitute, target) {
        substitute.performSubstitute(target);
    }

    performCollapse(target) {
        target.performCollapse();
    }

    showAnimation(subject, targets, animationId) {
        if (animationId < 0) {
            this.showAttackAnimation(subject, targets);
        } else {
            this.showNormalAnimation(targets, animationId);
        }
    }

    showAttackAnimation(subject, targets) {
        if (subject.isActor()) {
            this.showActorAttackAnimation(subject, targets);
        } else {
            this.showEnemyAttackAnimation(subject, targets);
        }
    }

    showActorAttackAnimation(subject, targets) {
        this.showNormalAnimation(targets, subject.attackAnimationId1(), false);
        this.showNormalAnimation(targets, subject.attackAnimationId2(), true);
    }

    showEnemyAttackAnimation(_subject, _targets) {
        SoundManager.playEnemyAttack();
    }

    showNormalAnimation(targets, animationId, mirror) {
        const animation = global.$dataAnimations[animationId];
        if (animation) {
            let delay = this.animationBaseDelay();
            const nextDelay = this.animationNextDelay();
            targets.forEach((target) => {
                target.startAnimation(animationId, mirror, delay);
                delay += nextDelay;
            });
        }
    }

    animationBaseDelay() {
        return 8;
    }

    animationNextDelay() {
        return 12;
    }

    refresh() {
        this.drawBackground();
        this.contents.clear();
        for (let i = 0; i < this._lines.length; i++) {
            this.drawLineText(i);
        }
    }

    drawBackground() {
        const rect = this.backRect();
        const color = this.backColor();
        this._backBitmap.clear();
        this._backBitmap.paintOpacity = this.backPaintOpacity();
        this._backBitmap.fillRect(rect.x, rect.y, rect.width, rect.height, color);
        this._backBitmap.paintOpacity = 255;
    }

    backRect() {
        return {
            x: 0,
            y: this.padding,
            width: this.width,
            height: this.numLines() * this.lineHeight(),
        };
    }

    backColor() {
        return '#000000';
    }

    backPaintOpacity() {
        return 64;
    }

    drawLineText(index) {
        const rect = this.itemRectForText(index);
        this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
        this.drawTextEx(this._lines[index], rect.x, rect.y, rect.width);
    }

    startTurn() {
        this.push('wait');
    }

    startAction(subject, action, targets) {
        const item = action.item();
        this.push('performActionStart', subject, action);
        this.push('waitForMovement');
        this.push('performAction', subject, action);
        this.push('showAnimation', subject, arrayClone(targets), item.animationId);
        this.displayAction(subject, item);
    }

    endAction(subject) {
        this.push('waitForNewLine');
        this.push('clear');
        this.push('performActionEnd', subject);
    }

    displayCurrentState(subject) {
        const stateText = subject.mostImportantStateText();
        if (stateText) {
            this.push('addText', subject.name() + stateText);
            this.push('wait');
            this.push('clear');
        }
    }

    displayRegeneration(subject) {
        this.push('popupDamage', subject);
    }

    displayAction(subject, item) {
        const numMethods = this._methods.length;
        if (DataManager.isSkill(item)) {
            if (item.message1) {
                this.push('addText', subject.name() + format(item.message1, item.name));
            }
            if (item.message2) {
                this.push('addText', format(item.message2, item.name));
            }
        } else {
            this.push('addText', format(TextManager.useItem, subject.name(), item.name));
        }
        if (this._methods.length === numMethods) {
            this.push('wait');
        }
    }

    displayCounter(target) {
        this.push('performCounter', target);
        this.push('addText', format(TextManager.counterAttack, target.name()));
    }

    displayReflection(target) {
        this.push('performReflection', target);
        this.push('addText', format(TextManager.magicReflection, target.name()));
    }

    displaySubstitute(substitute, target) {
        const substName = substitute.name();
        this.push('performSubstitute', substitute, target);
        this.push('addText', format(TextManager.substitute, substName, target.name()));
    }

    displayActionResults(subject, target) {
        if (target.result().used) {
            this.push('pushBaseLine');
            this.displayCritical(target);
            this.push('popupDamage', target);
            this.push('popupDamage', subject);
            this.displayDamage(target);
            this.displayAffectedStatus(target);
            this.displayFailure(target);
            this.push('waitForNewLine');
            this.push('popBaseLine');
        }
    }

    displayFailure(target) {
        if (target.result().isHit() && !target.result().success) {
            this.push('addText', format(TextManager.actionFailur, target.name()));
        }
    }

    displayCritical(target) {
        if (target.result().critical) {
            if (target.isActor()) {
                this.push('addText', TextManager.criticalToActor);
            } else {
                this.push('addText', TextManager.criticalToEnemy);
            }
        }
    }

    displayDamage(target) {
        if (target.result().missed) {
            this.displayMiss(target);
        } else if (target.result().evaded) {
            this.displayEvasion(target);
        } else {
            this.displayHpDamage(target);
            this.displayMpDamage(target);
            this.displayTpDamage(target);
        }
    }

    displayMiss(target) {
        let fmt;
        if (target.result().physical) {
            fmt = target.isActor() ? TextManager.actorNoHit : TextManager.enemyNoHit;
            this.push('performMiss', target);
        } else {
            fmt = TextManager.actionFailure;
        }
        this.push('addText', format(fmt, target.name()));
    }

    displayEvasion(target) {
        let fmt;
        if (target.result().physical) {
            fmt = TextManager.evasion;
            this.push('performEvasion', target);
        } else {
            fmt = TextManager.magicEvasion;
            this.push('performMagicEvasion', target);
        }
        this.push('addText', format(fmt, target.name()));
    }

    displayHpDamage(target) {
        if (target.result().hpAffected) {
            if (target.result().hpDamage > 0 && !target.result().drain) {
                this.push('performDamage', target);
            }
            if (target.result().hpDamage < 0) {
                this.push('performRecovery', target);
            }
            this.push('addText', this.makeHpDamageText(target));
        }
    }

    displayMpDamage(target) {
        if (target.isAlive() && target.result().mpDamage !== 0) {
            if (target.result().mpDamage < 0) {
                this.push('performRecovery', target);
            }
            this.push('addText', this.makeMpDamageText(target));
        }
    }

    displayTpDamage(target) {
        if (target.isAlive() && target.result().tpDamage !== 0) {
            if (target.result().tpDamage < 0) {
                this.push('performRecovery', target);
            }
            this.push('addText', this.makeTpDamageText(target));
        }
    }

    displayAffectedStatus(target) {
        if (target.result().isStatusAffected()) {
            this.push('pushBaseLine');
            this.displayChangedStates(target);
            this.displayChangedBuffs(target);
            this.push('waitForNewLine');
            this.push('popBaseLine');
        }
    }

    displayAutoAffectedStatus(target) {
        if (target.result().isStatusAffected()) {
            this.displayAffectedStatus(target, null);
            this.push('clear');
        }
    }

    displayChangedStates(target) {
        this.displayAddedStates(target);
        this.displayRemovedStates(target);
    }

    displayAddedStates(target) {
        target
            .result()
            .addedStateObjects()
            .forEach(function (state) {
                const stateMsg = target.isActor() ? state.message1 : state.message2;
                if (state.id === target.deathStateId()) {
                    this.push('performCollapse', target);
                }
                if (stateMsg) {
                    this.push('popBaseLine');
                    this.push('pushBaseLine');
                    this.push('addText', target.name() + stateMsg);
                    this.push('waitForEffect');
                }
            }, this);
    }

    displayRemovedStates(target) {
        target
            .result()
            .removedStateObjects()
            .forEach(function (state) {
                if (state.message4) {
                    this.push('popBaseLine');
                    this.push('pushBaseLine');
                    this.push('addText', target.name() + state.message4);
                }
            }, this);
    }

    displayChangedBuffs(target) {
        const result = target.result();
        this.displayBuffs(target, result.addedBuffs, TextManager.buffAdd);
        this.displayBuffs(target, result.addedDebuffs, TextManager.debuffAdd);
        this.displayBuffs(target, result.removedBuffs, TextManager.buffRemove);
    }

    displayBuffs(target, buffs, fmt) {
        buffs.forEach(function (paramId) {
            this.push('popBaseLine');
            this.push('pushBaseLine');
            this.push('addText', format(fmt, target.name(), TextManager.param(paramId)));
        }, this);
    }

    makeHpDamageText(target) {
        const result = target.result();
        const damage = result.hpDamage;
        const isActor = target.isActor();
        let fmt;
        if (damage > 0 && result.drain) {
            fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
            return format(fmt, target.name(), TextManager.hp, damage);
        } else if (damage > 0) {
            fmt = isActor ? TextManager.actorDamage : TextManager.enemyDamage;
            return format(fmt, target.name(), damage);
        } else if (damage < 0) {
            fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
            return format(fmt, target.name(), TextManager.hp, -damage);
        } else {
            fmt = isActor ? TextManager.actorNoDamage : TextManager.enemyNoDamage;
            return format(fmt, target.name());
        }
    }

    makeMpDamageText(target) {
        const result = target.result();
        const damage = result.mpDamage;
        const isActor = target.isActor();
        let fmt;
        if (damage > 0 && result.drain) {
            fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
            return format(fmt, target.name(), TextManager.mp, damage);
        } else if (damage > 0) {
            fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
            return format(fmt, target.name(), TextManager.mp, damage);
        } else if (damage < 0) {
            fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
            return format(fmt, target.name(), TextManager.mp, -damage);
        } else {
            return '';
        }
    }

    makeTpDamageText(target) {
        const result = target.result();
        const damage = result.tpDamage;
        const isActor = target.isActor();
        let fmt;
        if (damage > 0) {
            fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
            return format(fmt, target.name(), TextManager.tp, damage);
        } else if (damage < 0) {
            fmt = isActor ? TextManager.actorGain : TextManager.enemyGain;
            return format(fmt, target.name(), TextManager.tp, -damage);
        } else {
            return '';
        }
    }
}
