import { Bitmap } from '../rpg_core/Bitmap';
import { arrayClone, format } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { Sprite } from '../rpg_core/Sprite';
import { TouchInput } from '../rpg_core/TouchInput';
import { RPGItem } from '../rpg_data/item';
import { RPGSkill } from '../rpg_data/skill';
import { DataManager } from '../rpg_managers/DataManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';
import { Game_Action } from '../rpg_objects/Game_Action';
import { Game_Actor } from '../rpg_objects/Game_Actor';
import { Game_Battler } from '../rpg_objects/Game_Battler';
import { Spriteset_Battle } from '../rpg_sprites/Spriteset_Battle';
import { Window_Selectable } from './Window_Selectable';

/**
 * The window for displaying battle progress. No frame is displayed, but it is
 * handled as a window for convenience.
 */
export class Window_BattleLog extends Window_Selectable {
    protected _lines: string[] = [];
    protected _methods: { name: string; params: unknown[] }[] = [];
    protected _waitCount = 0;
    protected _waitMode = '';
    protected _baseLineStack: number[] = [];

    protected _spriteset: Spriteset_Battle;
    protected _backBitmap: Bitmap;
    protected _backSprite: Sprite;

    initialize(): void {
        const width = this.windowWidth();
        const height = this.windowHeight();
        super.initialize(0, 0, width, height);
        this.opacity = 0;
        this._spriteset = null;
        this.createBackBitmap();
        this.createBackSprite();
        this.refresh();
    }

    setSpriteset(spriteset: Spriteset_Battle): void {
        this._spriteset = spriteset;
    }

    windowWidth(): number {
        return Graphics.boxWidth;
    }

    windowHeight(): number {
        return this.fittingHeight(this.maxLines());
    }

    maxLines(): number {
        return 10;
    }

    createBackBitmap(): void {
        this._backBitmap = new Bitmap(this.width, this.height);
    }

    createBackSprite(): void {
        this._backSprite = new Sprite();
        this._backSprite.bitmap = this._backBitmap;
        this._backSprite.y = this.y;
        this.addChildToBack(this._backSprite);
    }

    numLines(): number {
        return this._lines.length;
    }

    messageSpeed(): number {
        return 16;
    }

    isBusy(): boolean {
        return this._waitCount > 0 || !!this._waitMode || this._methods.length > 0;
    }

    update(): void {
        if (!this.updateWait()) {
            this.callNextMethod();
        }
    }

    updateWait(): boolean {
        return this.updateWaitCount() || this.updateWaitMode();
    }

    updateWaitCount(): boolean {
        if (this._waitCount > 0) {
            this._waitCount -= this.isFastForward() ? 3 : 1;
            if (this._waitCount < 0) {
                this._waitCount = 0;
            }
            return true;
        }
        return false;
    }

    updateWaitMode(): boolean {
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

    setWaitMode(waitMode: string): void {
        this._waitMode = waitMode;
    }

    callNextMethod(): void {
        if (this._methods.length > 0) {
            const method = this._methods.shift();
            const methodName = method.name as BattleLogMethods;
            if (methodName && this[methodName]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this[methodName] as any)(...method.params);
            } else {
                throw new Error('Method not found: ' + method.name);
            }
        }
    }

    isFastForward(): boolean {
        return Input.isLongPressed('ok') || Input.isPressed('shift') || TouchInput.isLongPressed();
    }

    push(methodName: string, ...methodArgs: unknown[]): void {
        this._methods.push({ name: methodName, params: methodArgs });
    }

    clear(): void {
        this._lines = [];
        this._baseLineStack = [];
        this.refresh();
    }

    wait(): void {
        this._waitCount = this.messageSpeed();
    }

    waitForEffect(): void {
        this.setWaitMode('effect');
    }

    waitForMovement(): void {
        this.setWaitMode('movement');
    }

    addText(text: string): void {
        this._lines.push(text);
        this.refresh();
        this.wait();
    }

    pushBaseLine(): void {
        this._baseLineStack.push(this._lines.length);
    }

    popBaseLine(): void {
        const baseLine = this._baseLineStack.pop();
        while (this._lines.length > baseLine) {
            this._lines.pop();
        }
    }

    waitForNewLine(): void {
        let baseLine = 0;
        if (this._baseLineStack.length > 0) {
            baseLine = this._baseLineStack[this._baseLineStack.length - 1];
        }
        if (this._lines.length > baseLine) {
            this.wait();
        }
    }

    popupDamage(target: Game_Battler): void {
        target.startDamagePopup();
    }

    performActionStart(subject: Game_Battler, action: Game_Action): void {
        subject.performActionStart(action);
    }

    performAction(subject: Game_Battler, action: Game_Action): void {
        subject.performAction(action);
    }

    performActionEnd(subject: Game_Battler): void {
        subject.performActionEnd();
    }

    performDamage(target: Game_Battler): void {
        target.performDamage();
    }

    performMiss(target: Game_Battler): void {
        target.performMiss();
    }

    performRecovery(target: Game_Battler): void {
        target.performRecovery();
    }

    performEvasion(target: Game_Battler): void {
        target.performEvasion();
    }

    performMagicEvasion(target: Game_Battler): void {
        target.performMagicEvasion();
    }

    performCounter(target: Game_Battler): void {
        target.performCounter();
    }

    performReflection(target: Game_Battler): void {
        target.performReflection();
    }

    performSubstitute(substitute: Game_Battler, target: Game_Battler): void {
        substitute.performSubstitute(target);
    }

    performCollapse(target: Game_Battler): void {
        target.performCollapse();
    }

    showAnimation(subject: Game_Battler, targets: Game_Battler[], animationId: number): void {
        if (animationId < 0) {
            this.showAttackAnimation(subject, targets);
        } else {
            this.showNormalAnimation(targets, animationId);
        }
    }

    showAttackAnimation(subject: Game_Battler, targets: Game_Battler[]): void {
        if (subject.isActor()) {
            this.showActorAttackAnimation(subject, targets);
        } else {
            this.showEnemyAttackAnimation(subject, targets);
        }
    }

    showActorAttackAnimation(subject: Game_Actor, targets: Game_Battler[]): void {
        this.showNormalAnimation(targets, subject.attackAnimationId1(), false);
        this.showNormalAnimation(targets, subject.attackAnimationId2(), true);
    }

    showEnemyAttackAnimation(_subject: Game_Battler, _targets: Game_Battler[]): void {
        SoundManager.playEnemyAttack();
    }

    showNormalAnimation(targets: Game_Battler[], animationId: number, mirror = false): void {
        const animation = window.$dataAnimations[animationId];
        if (animation) {
            let delay = this.animationBaseDelay();
            const nextDelay = this.animationNextDelay();
            targets.forEach((target) => {
                target.startAnimation(animationId, mirror, delay);
                delay += nextDelay;
            });
        }
    }

    animationBaseDelay(): number {
        return 8;
    }

    animationNextDelay(): number {
        return 12;
    }

    refresh(): void {
        this.drawBackground();
        this.contents.clear();
        for (let i = 0; i < this._lines.length; i++) {
            this.drawLineText(i);
        }
    }

    drawBackground(): void {
        const rect = this.backRect();
        const color = this.backColor();
        this._backBitmap.clear();
        this._backBitmap.paintOpacity = this.backPaintOpacity();
        this._backBitmap.fillRect(rect.x, rect.y, rect.width, rect.height, color);
        this._backBitmap.paintOpacity = 255;
    }

    backRect(): PIXI.Rectangle {
        return new PIXI.Rectangle(0, this.padding, this.width, this.numLines() * this.lineHeight());
    }

    backColor(): string {
        return '#000000';
    }

    backPaintOpacity(): number {
        return 64;
    }

    drawLineText(index: number): void {
        const rect = this.itemRectForText(index);
        this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
        this.drawTextEx(this._lines[index], rect.x, rect.y);
    }

    startTurn(): void {
        this.push('wait');
    }

    startAction(subject: Game_Battler, action: Game_Action, targets: Game_Battler[]): void {
        const item = action.item();
        this.push('performActionStart', subject, action);
        this.push('waitForMovement');
        this.push('performAction', subject, action);
        this.push('showAnimation', subject, arrayClone(targets), item.animationId);
        this.displayAction(subject, item);
    }

    endAction(subject: Game_Battler): void {
        this.push('waitForNewLine');
        this.push('clear');
        this.push('performActionEnd', subject);
    }

    displayCurrentState(subject: Game_Battler): void {
        const stateText = subject.mostImportantStateText();
        if (stateText) {
            this.push('addText', subject.name() + stateText);
            this.push('wait');
            this.push('clear');
        }
    }

    displayRegeneration(subject: Game_Battler): void {
        this.push('popupDamage', subject);
    }

    displayAction(subject: Game_Battler, item: RPGItem | RPGSkill): void {
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

    displayCounter(target: Game_Battler): void {
        this.push('performCounter', target);
        this.push('addText', format(TextManager.counterAttack, target.name()));
    }

    displayReflection(target: Game_Battler): void {
        this.push('performReflection', target);
        this.push('addText', format(TextManager.magicReflection, target.name()));
    }

    displaySubstitute(substitute: Game_Battler, target: Game_Battler): void {
        const substName = substitute.name();
        this.push('performSubstitute', substitute, target);
        this.push('addText', format(TextManager.substitute, substName, target.name()));
    }

    displayActionResults(subject: Game_Battler, target: Game_Battler): void {
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

    displayFailure(target: Game_Battler): void {
        if (target.result().isHit() && !target.result().success) {
            this.push('addText', format(TextManager.actionFailure, target.name()));
        }
    }

    displayCritical(target: Game_Battler): void {
        if (target.result().critical) {
            if (target.isActor()) {
                this.push('addText', TextManager.criticalToActor);
            } else {
                this.push('addText', TextManager.criticalToEnemy);
            }
        }
    }

    displayDamage(target: Game_Battler): void {
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

    displayMiss(target: Game_Battler): void {
        let fmt: string;
        if (target.result().physical) {
            fmt = target.isActor() ? TextManager.actorNoHit : TextManager.enemyNoHit;
            this.push('performMiss', target);
        } else {
            fmt = TextManager.actionFailure;
        }
        this.push('addText', format(fmt, target.name()));
    }

    displayEvasion(target: Game_Battler): void {
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

    displayHpDamage(target: Game_Battler): void {
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

    displayMpDamage(target: Game_Battler): void {
        if (target.isAlive() && target.result().mpDamage !== 0) {
            if (target.result().mpDamage < 0) {
                this.push('performRecovery', target);
            }
            this.push('addText', this.makeMpDamageText(target));
        }
    }

    displayTpDamage(target: Game_Battler): void {
        if (target.isAlive() && target.result().tpDamage !== 0) {
            if (target.result().tpDamage < 0) {
                this.push('performRecovery', target);
            }
            this.push('addText', this.makeTpDamageText(target));
        }
    }

    displayAffectedStatus(target: Game_Battler): void {
        if (target.result().isStatusAffected()) {
            this.push('pushBaseLine');
            this.displayChangedStates(target);
            this.displayChangedBuffs(target);
            this.push('waitForNewLine');
            this.push('popBaseLine');
        }
    }

    displayAutoAffectedStatus(target: Game_Battler): void {
        if (target.result().isStatusAffected()) {
            this.displayAffectedStatus(target);
            this.push('clear');
        }
    }

    displayChangedStates(target: Game_Battler): void {
        this.displayAddedStates(target);
        this.displayRemovedStates(target);
    }

    displayAddedStates(target: Game_Battler): void {
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

    displayRemovedStates(target: Game_Battler): void {
        target
            .result()
            .removedStateObjects()
            .forEach((state) => {
                if (state.message4) {
                    this.push('popBaseLine');
                    this.push('pushBaseLine');
                    this.push('addText', target.name() + state.message4);
                }
            });
    }

    displayChangedBuffs(target: Game_Battler): void {
        const result = target.result();
        this.displayBuffs(target, result.addedBuffs, TextManager.buffAdd);
        this.displayBuffs(target, result.addedDebuffs, TextManager.debuffAdd);
        this.displayBuffs(target, result.removedBuffs, TextManager.buffRemove);
    }

    displayBuffs(target: Game_Battler, buffs: number[], fmt: string): void {
        buffs.forEach((paramId) => {
            this.push('popBaseLine');
            this.push('pushBaseLine');
            this.push('addText', format(fmt, target.name(), TextManager.param(paramId)));
        });
    }

    makeHpDamageText(target: Game_Battler): string {
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

    makeMpDamageText(target: Game_Battler): string {
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

    makeTpDamageText(target: Game_Battler): string {
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

type BattleLogMethods = {
    [K in keyof Window_BattleLog]: Window_BattleLog[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof Window_BattleLog];
