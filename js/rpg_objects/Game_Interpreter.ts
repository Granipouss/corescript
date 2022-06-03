/* eslint-disable @typescript-eslint/no-explicit-any */

import { arrayClone, randomInt } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { JsonEx } from '../rpg_core/JsonEx';
import { Utils } from '../rpg_core/Utils';
import type { RPGEventCommand } from '../rpg_data/event-command';
import type { RPGMoveRoute } from '../rpg_data/move-route';
import { AudioManager } from '../rpg_managers/AudioManager';
import { BattleManager } from '../rpg_managers/BattleManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Scene_Battle } from '../rpg_scenes/Scene_Battle';
import { Scene_Gameover } from '../rpg_scenes/Scene_Gameover';
import { Scene_Menu } from '../rpg_scenes/Scene_Menu';
import { Scene_Name } from '../rpg_scenes/Scene_Name';
import { Scene_Save } from '../rpg_scenes/Scene_Save';
import { Scene_Shop } from '../rpg_scenes/Scene_Shop';
import { Scene_Title } from '../rpg_scenes/Scene_Title';
import { Window_MenuCommand } from '../rpg_windows/Window_MenuCommand';
import type { Game_Actor } from './Game_Actor';
import type { Game_Battler } from './Game_Battler';
import { Game_Character } from './Game_Character';
import type { Game_Enemy } from './Game_Enemy';

export type EventInfo = {
    eventType: string;
    mapId?: number;
    mapEventId?: number;
    commonEventId?: number;
    troopId?: number;
    page?: number;
    line?: number;
};

/**
 * The interpreter for running event commands.
 */
export class Game_Interpreter {
    private _depth: number;
    private _branch: Record<number, unknown>;
    private _params: any[];
    private _indent: number;
    private _frameCount: number;
    private _freezeChecker: number;

    private _mapId: number;
    private _eventId: number;
    private _list: readonly RPGEventCommand[];
    private _index: number;
    private _waitCount: number;
    private _waitMode: string;
    private _comments: string[];
    private _eventInfo: EventInfo;
    private _character: any;
    private _childInterpreter?: Game_Interpreter;
    private _imageReservationId: any;

    constructor(depth = 0) {
        this._depth = depth || 0;
        this.checkOverflow();
        this.clear();
        this._branch = {};
        this._params = [];
        this._indent = 0;
        this._frameCount = 0;
        this._freezeChecker = 0;
    }

    checkOverflow(): void {
        if (this._depth >= 100) {
            throw new Error('Common event calls exceeded the limit');
        }
    }

    clear(): void {
        this._mapId = 0;
        this._eventId = 0;
        this._list = null;
        this._index = 0;
        this._waitCount = 0;
        this._waitMode = '';
        this._comments = [];
        this._eventInfo = null;
        this._character = null;
        this._childInterpreter = null;
    }

    setup(list: readonly RPGEventCommand[], eventId = 0): void {
        this.clear();
        this._mapId = window.$gameMap.mapId();
        this._eventId = eventId || 0;
        this._list = list;
        Game_Interpreter.requestImages(list);
    }

    eventId(): number {
        return this._eventId;
    }

    isOnCurrentMap(): boolean {
        return this._mapId === window.$gameMap.mapId();
    }

    setEventInfo(eventInfo: EventInfo): void {
        this._eventInfo = eventInfo;
    }

    setupReservedCommonEvent(): boolean {
        if (window.$gameTemp.isCommonEventReserved()) {
            this.setup(window.$gameTemp.reservedCommonEvent().list);
            this.setEventInfo({
                eventType: 'common_event',
                commonEventId: window.$gameTemp.reservedCommonEventId(),
            });
            window.$gameTemp.clearCommonEvent();
            return true;
        } else {
            return false;
        }
    }

    isRunning(): boolean {
        return !!this._list;
    }

    update(): void {
        while (this.isRunning()) {
            if (this.updateChild() || this.updateWait()) {
                break;
            }
            if (SceneManager.isSceneChanging()) {
                break;
            }
            if (!this.executeCommand()) {
                break;
            }
            if (this.checkFreeze()) {
                break;
            }
        }
    }

    updateChild(): boolean {
        if (this._childInterpreter) {
            this._childInterpreter.update();
            if (this._childInterpreter.isRunning()) {
                return true;
            } else {
                this._childInterpreter = null;
            }
        }
        return false;
    }

    updateWait(): boolean {
        return this.updateWaitCount() || this.updateWaitMode();
    }

    updateWaitCount(): boolean {
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        }
        return false;
    }

    updateWaitMode(): boolean {
        let waiting = false;
        switch (this._waitMode) {
            case 'message':
                waiting = window.$gameMessage.isBusy();
                break;
            case 'transfer':
                waiting = window.$gamePlayer.isTransferring();
                break;
            case 'scroll':
                waiting = window.$gameMap.isScrolling();
                break;
            case 'route':
                waiting = this._character.isMoveRouteForcing();
                break;
            case 'animation':
                waiting = this._character.isAnimationPlaying();
                break;
            case 'balloon':
                waiting = this._character.isBalloonPlaying();
                break;
            case 'gather':
                waiting = window.$gamePlayer.areFollowersGathering();
                break;
            case 'action':
                waiting = BattleManager.isActionForced();
                break;
            case 'video':
                waiting = Graphics.isVideoPlaying();
                break;
            case 'image':
                waiting = !ImageManager.isReady();
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

    wait(duration: number): void {
        this._waitCount = duration;
    }

    fadeSpeed(): number {
        return 24;
    }

    executeCommand(): boolean {
        const command = this.currentCommand();
        if (command) {
            this._params = command.parameters as any;
            this._indent = command.indent;
            const methodName = ('command' + command.code) as keyof Game_Interpreter;
            if (typeof this[methodName] === 'function') {
                try {
                    if (!(this[methodName] as any)()) {
                        return false;
                    }
                } catch (error) {
                    for (const key in this._eventInfo) {
                        error[key] = this._eventInfo[key as keyof EventInfo];
                    }
                    error.eventCommand = error.eventCommand || 'other';
                    error.line = error.line || this._index + 1;
                    throw error;
                }
            }
            this._index++;
        } else {
            this.terminate();
        }
        return true;
    }

    checkFreeze(): boolean {
        if (this._frameCount !== Graphics.frameCount) {
            this._frameCount = Graphics.frameCount;
            this._freezeChecker = 0;
        }
        if (this._freezeChecker++ >= 100000) {
            return true;
        } else {
            return false;
        }
    }

    terminate(): void {
        this._list = null;
        this._comments = [];
    }

    skipBranch(): void {
        while (this._list[this._index + 1].indent > this._indent) {
            this._index++;
        }
    }

    currentCommand(): RPGEventCommand {
        return this._list[this._index];
    }

    nextEventCode(): number {
        const command = this._list[this._index + 1];
        if (command) {
            return command.code;
        } else {
            return 0;
        }
    }

    iterateActorId(param: number, callback: (actor: Game_Actor) => void): void {
        if (param === 0) {
            window.$gameParty.members().forEach(callback);
        } else {
            const actor = window.$gameActors.actor(param);
            if (actor) {
                callback(actor);
            }
        }
    }

    iterateActorEx(param1: number, param2: number, callback: (actor: Game_Actor) => void): void {
        if (param1 === 0) {
            this.iterateActorId(param2, callback);
        } else {
            this.iterateActorId(window.$gameVariables.value(param2), callback);
        }
    }

    iterateActorIndex(param: number, callback: (actor: Game_Actor) => void): void {
        if (param < 0) {
            window.$gameParty.members().forEach(callback);
        } else {
            const actor = window.$gameParty.members()[param];
            if (actor) {
                callback(actor);
            }
        }
    }

    iterateEnemyIndex(param: number, callback: (enemy: Game_Enemy) => void): void {
        if (param < 0) {
            window.$gameTroop.members().forEach(callback);
        } else {
            const enemy = window.$gameTroop.members()[param];
            if (enemy) {
                callback(enemy);
            }
        }
    }

    iterateBattler(param1: number, param2: number, callback: (battler: Game_Battler) => void): void {
        if (window.$gameParty.inBattle()) {
            if (param1 === 0) {
                this.iterateEnemyIndex(param2, callback);
            } else {
                this.iterateActorId(param2, callback);
            }
        }
    }

    character(param: number): Game_Character {
        if (window.$gameParty.inBattle()) {
            return null;
        } else if (param < 0) {
            return window.$gamePlayer;
        } else if (this.isOnCurrentMap()) {
            return window.$gameMap.event(param > 0 ? param : this._eventId);
        } else {
            return null;
        }
    }

    operateValue(operation: number, operandType: number, operand: number): number {
        const value = operandType === 0 ? operand : window.$gameVariables.value(operand);
        return operation === 0 ? value : -value;
    }

    changeHp(target: Game_Battler, value: number, allowDeath = false): void {
        if (target.isAlive()) {
            if (!allowDeath && target.hp <= -value) {
                value = 1 - target.hp;
            }
            target.gainHp(value);
            if (target.isDead()) {
                target.performCollapse();
            }
        }
    }

    // Show Text
    command101(): boolean {
        if (!window.$gameMessage.isBusy()) {
            window.$gameMessage.setFaceImage(this._params[0], this._params[1]);
            window.$gameMessage.setBackground(this._params[2]);
            window.$gameMessage.setPositionType(this._params[3]);
            while (this.nextEventCode() === 401) {
                // Text data
                this._index++;
                window.$gameMessage.add(this.currentCommand().parameters[0]);
            }
            switch (this.nextEventCode()) {
                case 102: // Show Choices
                    this._index++;
                    this.setupChoices(this.currentCommand().parameters as any);
                    break;
                case 103: // Input Number
                    this._index++;
                    this.setupNumInput(this.currentCommand().parameters);
                    break;
                case 104: // Select Item
                    this._index++;
                    this.setupItemChoice(this.currentCommand().parameters);
                    break;
            }
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    // Show Choices
    command102(): boolean {
        if (!window.$gameMessage.isBusy()) {
            this.setupChoices(this._params as any);
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    setupChoices(params: readonly [string[], number, number?, number?, number?]): void {
        const choices = arrayClone(params[0]);
        let cancelType = params[1];
        const defaultType = params.length > 2 ? params[2] : 0;
        const positionType = params.length > 3 ? params[3] : 2;
        const background = params.length > 4 ? params[4] : 0;
        if (cancelType >= choices.length) {
            cancelType = -2;
        }
        window.$gameMessage.setChoices(choices, defaultType, cancelType);
        window.$gameMessage.setChoiceBackground(background);
        window.$gameMessage.setChoicePositionType(positionType);
        window.$gameMessage.setChoiceCallback((n) => {
            this._branch[this._indent] = n;
        });
    }

    // When [**]
    command402(): boolean {
        if (this._branch[this._indent] !== this._params[0]) {
            this.skipBranch();
        }
        return true;
    }

    // When Cancel
    command403(): boolean {
        if (this._branch[this._indent] >= 0) {
            this.skipBranch();
        }
        return true;
    }

    // Input Number
    command103(): boolean {
        if (!window.$gameMessage.isBusy()) {
            this.setupNumInput(this._params);
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    setupNumInput(params: readonly any[]): void {
        window.$gameMessage.setNumberInput(params[0], params[1]);
    }

    // Select Item
    command104(): boolean {
        if (!window.$gameMessage.isBusy()) {
            this.setupItemChoice(this._params);
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    setupItemChoice(params: readonly any[]): void {
        window.$gameMessage.setItemChoice(params[0], params[1] || 2);
    }

    // Show Scrolling Text
    command105(): boolean {
        if (!window.$gameMessage.isBusy()) {
            window.$gameMessage.setScroll(this._params[0], this._params[1]);
            while (this.nextEventCode() === 405) {
                this._index++;
                window.$gameMessage.add(this.currentCommand().parameters[0]);
            }
            this._index++;
            this.setWaitMode('message');
        }
        return false;
    }

    // Comment
    command108(): boolean {
        this._comments = [this._params[0]];
        while (this.nextEventCode() === 408) {
            this._index++;
            this._comments.push(this.currentCommand().parameters[0]);
        }
        return true;
    }

    // Conditional Branch
    command111(): boolean {
        let result = false;
        switch (this._params[0]) {
            // Switch
            case 0: {
                result = window.$gameSwitches.value(this._params[1]) === (this._params[2] === 0);
                break;
            }
            // Variable
            case 1: {
                const value1 = window.$gameVariables.value(this._params[1]);
                let value2;
                if (this._params[2] === 0) {
                    value2 = this._params[3];
                } else {
                    value2 = window.$gameVariables.value(this._params[3]);
                }
                switch (this._params[4]) {
                    case 0: // Equal to
                        result = value1 === value2;
                        break;
                    case 1: // Greater than or Equal to
                        result = value1 >= value2;
                        break;
                    case 2: // Less than or Equal to
                        result = value1 <= value2;
                        break;
                    case 3: // Greater than
                        result = value1 > value2;
                        break;
                    case 4: // Less than
                        result = value1 < value2;
                        break;
                    case 5: // Not Equal to
                        result = value1 !== value2;
                        break;
                }
                break;
            }
            // Self Switch
            case 2: {
                if (this._eventId > 0) {
                    const key = [this._mapId, this._eventId, this._params[1]] as const;
                    result = window.$gameSelfSwitches.value(key) === (this._params[2] === 0);
                }
                break;
            }
            // Timer
            case 3: {
                if (window.$gameTimer.isWorking()) {
                    if (this._params[2] === 0) {
                        result = window.$gameTimer.seconds() >= this._params[1];
                    } else {
                        result = window.$gameTimer.seconds() <= this._params[1];
                    }
                }
                break;
            }
            // Actor
            case 4: {
                const actor = window.$gameActors.actor(this._params[1]);
                if (actor) {
                    const n = this._params[3];
                    switch (this._params[2]) {
                        case 0: // In the Party
                            result = window.$gameParty.members().includes(actor);
                            break;
                        case 1: // Name
                            result = actor.name() === n;
                            break;
                        case 2: // Class
                            result = actor.isClass(window.$dataClasses[n]);
                            break;
                        case 3: // Skill
                            result = actor.hasSkill(n);
                            break;
                        case 4: // Weapon
                            result = actor.hasWeapon(window.$dataWeapons[n]);
                            break;
                        case 5: // Armor
                            result = actor.hasArmor(window.$dataArmors[n]);
                            break;
                        case 6: // State
                            result = actor.isStateAffected(n);
                            break;
                    }
                }
                break;
            }
            // Enemy
            case 5: {
                const enemy = window.$gameTroop.members()[this._params[1]];
                if (enemy) {
                    switch (this._params[2]) {
                        case 0: // Appeared
                            result = enemy.isAlive();
                            break;
                        case 1: // State
                            result = enemy.isStateAffected(this._params[3]);
                            break;
                    }
                }
                break;
            }
            // Character
            case 6: {
                const character = this.character(this._params[1]);
                if (character) {
                    result = character.direction() === this._params[2];
                }
                break;
            }
            // Gold
            case 7: {
                switch (this._params[2]) {
                    case 0: // Greater than or equal to
                        result = window.$gameParty.gold() >= this._params[1];
                        break;
                    case 1: // Less than or equal to
                        result = window.$gameParty.gold() <= this._params[1];
                        break;
                    case 2: // Less than
                        result = window.$gameParty.gold() < this._params[1];
                        break;
                }
                break;
            }
            case 8: // Item
                result = window.$gameParty.hasItem(window.$dataItems[this._params[1]]);
                break;
            case 9: // Weapon
                result = window.$gameParty.hasItem(window.$dataWeapons[this._params[1]], this._params[2]);
                break;
            case 10: // Armor
                result = window.$gameParty.hasItem(window.$dataArmors[this._params[1]], this._params[2]);
                break;
            case 11: // Button
                result = Input.isPressed(this._params[1]);
                break;
            case 12: // Script
                try {
                    result = !!eval(this._params[1]);
                } catch (error) {
                    error.eventCommand = 'conditional_branch_script';
                    error.content = this._params[1];
                    throw error;
                }
                break;
            case 13: // Vehicle
                result = window.$gamePlayer.vehicle() === window.$gameMap.vehicle(this._params[1]);
                break;
        }
        this._branch[this._indent] = result;
        if (this._branch[this._indent] === false) {
            this.skipBranch();
        }
        return true;
    }

    // Else
    command411(): boolean {
        if (this._branch[this._indent] !== false) {
            this.skipBranch();
        }
        return true;
    }

    // Loop
    command112(): boolean {
        return true;
    }

    // Repeat Above
    command413(): boolean {
        do {
            this._index--;
        } while (this.currentCommand().indent !== this._indent);
        return true;
    }

    // Break Loop
    command113(): boolean {
        let depth = 0;
        while (this._index < this._list.length - 1) {
            this._index++;
            const command = this.currentCommand();

            if (command.code === 112) depth++;

            if (command.code === 413) {
                if (depth > 0) depth--;
                else break;
            }
        }
        return true;
    }

    // Exit Event Processing
    command115(): boolean {
        this._index = this._list.length;
        return true;
    }

    // Common Event
    command117(): boolean {
        const commonEvent = window.$dataCommonEvents[this._params[0]];
        if (commonEvent) {
            const eventId = this.isOnCurrentMap() ? this._eventId : 0;
            this.setupChild(commonEvent.list, eventId);
        }
        return true;
    }

    setupChild(list: readonly RPGEventCommand[], eventId: number): void {
        this._childInterpreter = new Game_Interpreter(this._depth + 1);
        this._childInterpreter.setup(list, eventId);
        this._childInterpreter.setEventInfo({
            eventType: 'common_event',
            commonEventId: this._params[0],
        });
    }

    // Label
    command118(): boolean {
        return true;
    }

    // Jump to Label
    command119(): boolean {
        const labelName = this._params[0];
        for (let i = 0; i < this._list.length; i++) {
            const command = this._list[i];
            if (command.code === 118 && command.parameters[0] === labelName) {
                this.jumpTo(i);
                return;
            }
        }
        return true;
    }

    jumpTo(index: number): void {
        const lastIndex = this._index;
        const startIndex = Math.min(index, lastIndex);
        const endIndex = Math.max(index, lastIndex);
        let indent = this._indent;
        for (let i = startIndex; i <= endIndex; i++) {
            const newIndent = this._list[i].indent;
            if (newIndent !== indent) {
                this._branch[indent] = null;
                indent = newIndent;
            }
        }
        this._index = index;
    }

    // Control Switches
    command121(): boolean {
        for (let i = this._params[0]; i <= this._params[1]; i++) {
            window.$gameSwitches.setValue(i, this._params[2] === 0);
        }
        return true;
    }

    // Control Variables
    command122(): boolean {
        let value = 0;
        switch (
            this._params[3] // Operand
        ) {
            case 0: // Constant
                value = this._params[4];
                break;
            case 1: // Variable
                value = window.$gameVariables.value(this._params[4]);
                break;
            case 2: {
                // Random
                value = this._params[5] - this._params[4] + 1;
                for (let i = this._params[0]; i <= this._params[1]; i++) {
                    this.operateVariable(i, this._params[2], this._params[4] + randomInt(value));
                }
                return true;
            }
            case 3: // Game Data
                value = this.gameDataOperand(this._params[4], this._params[5], this._params[6]);
                break;
            case 4: // Script
                try {
                    value = eval(this._params[4]);
                } catch (error) {
                    error.eventCommand = 'control_variables';
                    error.content = this._params[4];
                    throw error;
                }
                break;
        }
        for (let i = this._params[0]; i <= this._params[1]; i++) {
            this.operateVariable(i, this._params[2], value);
        }
        return true;
    }

    gameDataOperand(type: number, param1: number, param2: number): number {
        switch (type) {
            case 0: // Item
                return window.$gameParty.numItems(window.$dataItems[param1]);
            case 1: // Weapon
                return window.$gameParty.numItems(window.$dataWeapons[param1]);
            case 2: // Armor
                return window.$gameParty.numItems(window.$dataArmors[param1]);
            // Actor
            case 3: {
                const actor = window.$gameActors.actor(param1);
                if (actor) {
                    switch (param2) {
                        case 0: // Level
                            return actor.level;
                        case 1: // EXP
                            return actor.currentExp();
                        case 2: // HP
                            return actor.hp;
                        case 3: // MP
                            return actor.mp;
                        default: // Parameter
                            if (param2 >= 4 && param2 <= 11) {
                                return actor.param(param2 - 4);
                            }
                    }
                }
                break;
            }
            // Enemy
            case 4: {
                const enemy = window.$gameTroop.members()[param1];
                if (enemy) {
                    switch (param2) {
                        case 0: // HP
                            return enemy.hp;
                        case 1: // MP
                            return enemy.mp;
                        default: // Parameter
                            if (param2 >= 2 && param2 <= 9) {
                                return enemy.param(param2 - 2);
                            }
                    }
                }
                break;
            }
            // Character
            case 5: {
                const character = this.character(param1);
                if (character) {
                    switch (param2) {
                        case 0: // Map X
                            return character.x;
                        case 1: // Map Y
                            return character.y;
                        case 2: // Direction
                            return character.direction();
                        case 3: // Screen X
                            return character.screenX();
                        case 4: // Screen Y
                            return character.screenY();
                    }
                }
                break;
            }
            // Party
            case 6: {
                const actor = window.$gameParty.members()[param1];
                return actor ? actor.actorId() : 0;
            }
            // Other
            case 7: {
                switch (param1) {
                    case 0: // Map ID
                        return window.$gameMap.mapId();
                    case 1: // Party Members
                        return window.$gameParty.size();
                    case 2: // Gold
                        return window.$gameParty.gold();
                    case 3: // Steps
                        return window.$gameParty.steps();
                    case 4: // Play Time
                        return window.$gameSystem.playtime();
                    case 5: // Timer
                        return window.$gameTimer.seconds();
                    case 6: // Save Count
                        return window.$gameSystem.saveCount();
                    case 7: // Battle Count
                        return window.$gameSystem.battleCount();
                    case 8: // Win Count
                        return window.$gameSystem.winCount();
                    case 9: // Escape Count
                        return window.$gameSystem.escapeCount();
                }
                break;
            }
        }
        return 0;
    }

    operateVariable(variableId: number, operationType: number, value: number): void {
        try {
            let oldValue = window.$gameVariables.value(variableId);
            switch (operationType) {
                case 0: // Set
                    window.$gameVariables.setValue(variableId, (oldValue = value));
                    break;
                case 1: // Add
                    window.$gameVariables.setValue(variableId, oldValue + value);
                    break;
                case 2: // Sub
                    window.$gameVariables.setValue(variableId, oldValue - value);
                    break;
                case 3: // Mul
                    window.$gameVariables.setValue(variableId, oldValue * value);
                    break;
                case 4: // Div
                    window.$gameVariables.setValue(variableId, oldValue / value);
                    break;
                case 5: // Mod
                    window.$gameVariables.setValue(variableId, oldValue % value);
                    break;
            }
        } catch (e) {
            window.$gameVariables.setValue(variableId, 0);
        }
    }

    // Control Self Switch
    command123(): boolean {
        if (this._eventId > 0) {
            const key = [this._mapId, this._eventId, this._params[0]] as const;
            window.$gameSelfSwitches.setValue(key, this._params[1] === 0);
        }
        return true;
    }

    // Control Timer
    command124(): boolean {
        if (this._params[0] === 0) {
            // Start
            window.$gameTimer.start(this._params[1] * 60);
        } else {
            // Stop
            window.$gameTimer.stop();
        }
        return true;
    }

    // Change Gold
    command125(): boolean {
        const value = this.operateValue(this._params[0], this._params[1], this._params[2]);
        window.$gameParty.gainGold(value);
        return true;
    }

    // Change Items
    command126(): boolean {
        const value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        window.$gameParty.gainItem(window.$dataItems[this._params[0]], value);
        return true;
    }

    // Change Weapons
    command127(): boolean {
        const value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        window.$gameParty.gainItem(window.$dataWeapons[this._params[0]], value, this._params[4]);
        return true;
    }

    // Change Armors
    command128(): boolean {
        const value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        window.$gameParty.gainItem(window.$dataArmors[this._params[0]], value, this._params[4]);
        return true;
    }

    // Change Party Member
    command129(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor) {
            if (this._params[1] === 0) {
                // Add
                if (this._params[2]) {
                    // Initialize
                    window.$gameActors.actor(this._params[0]).setup(this._params[0]);
                }
                window.$gameParty.addActor(this._params[0]);
            } else {
                // Remove
                window.$gameParty.removeActor(this._params[0]);
            }
        }
        return true;
    }

    // Change Battle BGM
    command132(): boolean {
        window.$gameSystem.setBattleBgm(this._params[0]);
        return true;
    }

    // Change Victory ME
    command133(): boolean {
        window.$gameSystem.setVictoryMe(this._params[0]);
        return true;
    }

    // Change Save Access
    command134(): boolean {
        if (this._params[0] === 0) {
            window.$gameSystem.disableSave();
        } else {
            window.$gameSystem.enableSave();
        }
        return true;
    }

    // Change Menu Access
    command135(): boolean {
        if (this._params[0] === 0) {
            window.$gameSystem.disableMenu();
        } else {
            window.$gameSystem.enableMenu();
        }
        return true;
    }

    // Change Encounter Disable
    command136(): boolean {
        if (this._params[0] === 0) {
            window.$gameSystem.disableEncounter();
        } else {
            window.$gameSystem.enableEncounter();
        }
        window.$gamePlayer.makeEncounterCount();
        return true;
    }

    // Change Formation Access
    command137(): boolean {
        if (this._params[0] === 0) {
            window.$gameSystem.disableFormation();
        } else {
            window.$gameSystem.enableFormation();
        }
        return true;
    }

    // Change Window Color
    command138(): boolean {
        window.$gameSystem.setWindowTone(this._params[0]);
        return true;
    }

    // Change Defeat ME
    command139(): boolean {
        window.$gameSystem.setDefeatMe(this._params[0]);
        return true;
    }

    // Change Vehicle BGM
    command140(): boolean {
        const vehicle = window.$gameMap.vehicle(this._params[0]);
        if (vehicle) {
            vehicle.setBgm(this._params[1]);
        }
        return true;
    }

    // Transfer Player
    command201(): boolean {
        if (!window.$gameParty.inBattle() && !window.$gameMessage.isBusy()) {
            let mapId, x, y;
            if (this._params[0] === 0) {
                // Direct designation
                mapId = this._params[1];
                x = this._params[2];
                y = this._params[3];
            } else {
                // Designation with variables
                mapId = window.$gameVariables.value(this._params[1]);
                x = window.$gameVariables.value(this._params[2]);
                y = window.$gameVariables.value(this._params[3]);
            }
            window.$gamePlayer.reserveTransfer(mapId, x, y, this._params[4], this._params[5]);
            this.setWaitMode('transfer');
            this._index++;
        }
        return false;
    }

    // Set Vehicle Location
    command202(): boolean {
        let mapId, x, y;
        if (this._params[1] === 0) {
            // Direct designation
            mapId = this._params[2];
            x = this._params[3];
            y = this._params[4];
        } else {
            // Designation with variables
            mapId = window.$gameVariables.value(this._params[2]);
            x = window.$gameVariables.value(this._params[3]);
            y = window.$gameVariables.value(this._params[4]);
        }
        const vehicle = window.$gameMap.vehicle(this._params[0]);
        if (vehicle) {
            vehicle.setLocation(mapId, x, y);
        }
        return true;
    }

    // Set Event Location
    command203(): boolean {
        const character = this.character(this._params[0]);
        if (character) {
            if (this._params[1] === 0) {
                // Direct designation
                character.locate(this._params[2], this._params[3]);
            } else if (this._params[1] === 1) {
                // Designation with variables
                const x = window.$gameVariables.value(this._params[2]);
                const y = window.$gameVariables.value(this._params[3]);
                character.locate(x, y);
            } else {
                // Exchange with another event
                const character2 = this.character(this._params[2]);
                if (character2) {
                    character.swap(character2);
                }
            }
            if (this._params[4] > 0) {
                character.setDirection(this._params[4]);
            }
        }
        return true;
    }

    // Scroll Map
    command204(): boolean {
        if (!window.$gameParty.inBattle()) {
            if (window.$gameMap.isScrolling()) {
                this.setWaitMode('scroll');
                return false;
            }
            window.$gameMap.startScroll(this._params[0], this._params[1], this._params[2]);
        }
        return true;
    }

    // Set Movement Route
    command205(): boolean {
        window.$gameMap.refreshIfNeeded();
        this._character = this.character(this._params[0]);
        if (this._character) {
            this._character.forceMoveRoute(this._params[1]);
            const eventInfo = JsonEx.makeDeepCopy(this._eventInfo);
            eventInfo.line = this._index + 1;
            this._character.setCallerEventInfo(eventInfo);
            if (this._params[1].wait) {
                this.setWaitMode('route');
            }
        }
        return true;
    }

    // Getting On and Off Vehicles
    command206(): boolean {
        window.$gamePlayer.getOnOffVehicle();
        return true;
    }

    // Change Transparency
    command211(): boolean {
        window.$gamePlayer.setTransparent(this._params[0] === 0);
        return true;
    }

    // Show Animation
    command212(): boolean {
        this._character = this.character(this._params[0]);
        if (this._character) {
            this._character.requestAnimation(this._params[1]);
            if (this._params[2]) {
                this.setWaitMode('animation');
            }
        }
        return true;
    }

    // Show Balloon Icon
    command213(): boolean {
        this._character = this.character(this._params[0]);
        if (this._character) {
            this._character.requestBalloon(this._params[1]);
            if (this._params[2]) {
                this.setWaitMode('balloon');
            }
        }
        return true;
    }

    // Erase Event
    command214(): boolean {
        if (this.isOnCurrentMap() && this._eventId > 0) {
            window.$gameMap.eraseEvent(this._eventId);
        }
        return true;
    }

    // Change Player Followers
    command216(): boolean {
        if (this._params[0] === 0) {
            window.$gamePlayer.showFollowers();
        } else {
            window.$gamePlayer.hideFollowers();
        }
        window.$gamePlayer.refresh();
        return true;
    }

    // Gather Followers
    command217(): boolean {
        if (!window.$gameParty.inBattle()) {
            window.$gamePlayer.gatherFollowers();
            this.setWaitMode('gather');
        }
        return true;
    }

    // Fadeout Screen
    command221(): boolean {
        if (!window.$gameMessage.isBusy()) {
            window.$gameScreen.startFadeOut(this.fadeSpeed());
            this.wait(this.fadeSpeed());
            this._index++;
        }
        return false;
    }

    // Fadein Screen
    command222(): boolean {
        if (!window.$gameMessage.isBusy()) {
            window.$gameScreen.startFadeIn(this.fadeSpeed());
            this.wait(this.fadeSpeed());
            this._index++;
        }
        return false;
    }

    // Tint Screen
    command223(): boolean {
        window.$gameScreen.startTint(this._params[0], this._params[1]);
        if (this._params[2]) {
            this.wait(this._params[1]);
        }
        return true;
    }

    // Flash Screen
    command224(): boolean {
        window.$gameScreen.startFlash(this._params[0], this._params[1]);
        if (this._params[2]) {
            this.wait(this._params[1]);
        }
        return true;
    }

    // Shake Screen
    command225(): boolean {
        window.$gameScreen.startShake(this._params[0], this._params[1], this._params[2]);
        if (this._params[3]) {
            this.wait(this._params[2]);
        }
        return true;
    }

    // Wait
    command230(): boolean {
        this.wait(this._params[0]);
        return true;
    }

    // Show Picture
    command231(): boolean {
        let x, y;
        if (this._params[3] === 0) {
            // Direct designation
            x = this._params[4];
            y = this._params[5];
        } else {
            // Designation with variables
            x = window.$gameVariables.value(this._params[4]);
            y = window.$gameVariables.value(this._params[5]);
        }
        window.$gameScreen.showPicture(
            this._params[0],
            this._params[1],
            this._params[2],
            x,
            y,
            this._params[6],
            this._params[7],
            this._params[8],
            this._params[9]
        );
        return true;
    }

    // Move Picture
    command232(): boolean {
        let x, y;
        if (this._params[3] === 0) {
            // Direct designation
            x = this._params[4];
            y = this._params[5];
        } else {
            // Designation with variables
            x = window.$gameVariables.value(this._params[4]);
            y = window.$gameVariables.value(this._params[5]);
        }
        window.$gameScreen.movePicture(
            this._params[0],
            this._params[2],
            x,
            y,
            this._params[6],
            this._params[7],
            this._params[8],
            this._params[9],
            this._params[10]
        );
        if (this._params[11]) {
            this.wait(this._params[10]);
        }
        return true;
    }

    // Rotate Picture
    command233(): boolean {
        window.$gameScreen.rotatePicture(this._params[0], this._params[1]);
        return true;
    }

    // Tint Picture
    command234(): boolean {
        window.$gameScreen.tintPicture(this._params[0], this._params[1], this._params[2]);
        if (this._params[3]) {
            this.wait(this._params[2]);
        }
        return true;
    }

    // Erase Picture
    command235(): boolean {
        window.$gameScreen.erasePicture(this._params[0]);
        return true;
    }

    // Set Weather Effect
    command236(): boolean {
        if (!window.$gameParty.inBattle()) {
            window.$gameScreen.changeWeather(this._params[0], this._params[1], this._params[2]);
            if (this._params[3]) {
                this.wait(this._params[2]);
            }
        }
        return true;
    }

    // Play BGM
    command241(): boolean {
        AudioManager.playBgm(this._params[0]);
        return true;
    }

    // Fadeout BGM
    command242(): boolean {
        AudioManager.fadeOutBgm(this._params[0]);
        return true;
    }

    // Save BGM
    command243(): boolean {
        window.$gameSystem.saveBgm();
        return true;
    }

    // Resume BGM
    command244(): boolean {
        window.$gameSystem.replayBgm();
        return true;
    }

    // Play BGS
    command245(): boolean {
        AudioManager.playBgs(this._params[0]);
        return true;
    }

    // Fadeout BGS
    command246(): boolean {
        AudioManager.fadeOutBgs(this._params[0]);
        return true;
    }

    // Play ME
    command249(): boolean {
        AudioManager.playMe(this._params[0]);
        return true;
    }

    // Play SE
    command250(): boolean {
        AudioManager.playSe(this._params[0]);
        return true;
    }

    // Stop SE
    command251(): boolean {
        AudioManager.stopSe();
        return true;
    }

    // Play Movie
    command261(): boolean {
        if (!window.$gameMessage.isBusy()) {
            const name = this._params[0];
            if (name.length > 0) {
                const ext = this.videoFileExt();
                Graphics.playVideo('movies/' + name + ext);
                this.setWaitMode('video');
            }
            this._index++;
        }
        return false;
    }

    videoFileExt(): '.webm' | '.mp4' {
        if (Graphics.canPlayVideoType('video/webm') && !Utils.isMobileDevice()) {
            return '.webm';
        } else {
            return '.mp4';
        }
    }

    // Change Map Name Display
    command281(): boolean {
        if (this._params[0] === 0) {
            window.$gameMap.enableNameDisplay();
        } else {
            window.$gameMap.disableNameDisplay();
        }
        return true;
    }

    // Change Tileset
    command282(): boolean {
        const tileset = window.$dataTilesets[this._params[0]];
        if (!this._imageReservationId) {
            this._imageReservationId = Utils.generateRuntimeId();
        }

        const allReady = tileset.tilesetNames
            .map(function (tilesetName) {
                return ImageManager.reserveTileset(tilesetName, 0, this._imageReservationId);
            }, this)
            .every((bitmap) => bitmap.isReady());

        if (allReady) {
            window.$gameMap.changeTileset(this._params[0]);
            ImageManager.releaseReservation(this._imageReservationId);
            this._imageReservationId = null;

            return true;
        } else {
            return false;
        }
    }

    // Change Battle Back
    command283(): boolean {
        window.$gameMap.changeBattleback(this._params[0], this._params[1]);
        return true;
    }

    // Change Parallax
    command284(): boolean {
        window.$gameMap.changeParallax(
            this._params[0],
            this._params[1],
            this._params[2],
            this._params[3],
            this._params[4]
        );
        return true;
    }

    // Get Location Info
    command285(): boolean {
        let x, y, value;
        if (this._params[2] === 0) {
            // Direct designation
            x = this._params[3];
            y = this._params[4];
        } else {
            // Designation with variables
            x = window.$gameVariables.value(this._params[3]);
            y = window.$gameVariables.value(this._params[4]);
        }
        switch (this._params[1]) {
            case 0: // Terrain Tag
                value = window.$gameMap.terrainTag(x, y);
                break;
            case 1: // Event ID
                value = window.$gameMap.eventIdXy(x, y);
                break;
            case 2: // Tile ID (Layer 1)
            case 3: // Tile ID (Layer 2)
            case 4: // Tile ID (Layer 3)
            case 5: // Tile ID (Layer 4)
                value = window.$gameMap.tileId(x, y, this._params[1] - 2);
                break;
            default: // Region ID
                value = window.$gameMap.regionId(x, y);
                break;
        }
        window.$gameVariables.setValue(this._params[0], value);
        return true;
    }

    // Battle Processing
    command301(): boolean {
        if (!window.$gameParty.inBattle()) {
            let troopId;
            if (this._params[0] === 0) {
                // Direct designation
                troopId = this._params[1];
            } else if (this._params[0] === 1) {
                // Designation with a variable
                troopId = window.$gameVariables.value(this._params[1]);
            } else {
                // Same as Random Encounter
                troopId = window.$gamePlayer.makeEncounterTroopId();
            }
            if (window.$dataTroops[troopId]) {
                BattleManager.setup(troopId, this._params[2], this._params[3]);
                BattleManager.setEventCallback((n: unknown) => {
                    this._branch[this._indent] = n;
                });
                window.$gamePlayer.makeEncounterCount();
                SceneManager.push(Scene_Battle);
            }
        }
        return true;
    }

    // If Win
    command601(): boolean {
        if (this._branch[this._indent] !== 0) {
            this.skipBranch();
        }
        return true;
    }

    // If Escape
    command602(): boolean {
        if (this._branch[this._indent] !== 1) {
            this.skipBranch();
        }
        return true;
    }

    // If Lose
    command603(): boolean {
        if (this._branch[this._indent] !== 2) {
            this.skipBranch();
        }
        return true;
    }

    // Shop Processing
    command302(): boolean {
        if (!window.$gameParty.inBattle()) {
            const goods = [this._params];
            while (this.nextEventCode() === 605) {
                this._index++;
                goods.push([...this.currentCommand().parameters]);
            }
            SceneManager.push(Scene_Shop, goods as [number, number, number, number][], this._params[4]);
        }
        return true;
    }

    // Name Input Processing
    command303(): boolean {
        if (!window.$gameParty.inBattle()) {
            if (window.$dataActors[this._params[0]]) {
                SceneManager.push(Scene_Name, this._params[0], this._params[1]);
            }
        }
        return true;
    }

    // Change HP
    command311(): boolean {
        const value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            this.changeHp(actor, value, this._params[5]);
        });
        return true;
    }

    // Change MP
    command312(): boolean {
        const value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            actor.gainMp(value);
        });
        return true;
    }

    // Change TP
    command326(): boolean {
        const value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            actor.gainTp(value);
        });
        return true;
    }

    // Change State
    command313(): boolean {
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            const alreadyDead = actor.isDead();
            if (this._params[2] === 0) {
                actor.addState(this._params[3]);
            } else {
                actor.removeState(this._params[3]);
            }
            if (actor.isDead() && !alreadyDead) {
                actor.performCollapse();
            }
            actor.clearResult();
        });
        return true;
    }

    // Recover All
    command314(): boolean {
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            actor.recoverAll();
        });
        return true;
    }

    // Change EXP
    command315(): boolean {
        const value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            actor.changeExp(actor.currentExp() + value, this._params[5]);
        });
        return true;
    }

    // Change Level
    command316(): boolean {
        const value = this.operateValue(this._params[2], this._params[3], this._params[4]);
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            actor.changeLevel(actor.level + value, this._params[5]);
        });
        return true;
    }

    // Change Parameter
    command317(): boolean {
        const value = this.operateValue(this._params[3], this._params[4], this._params[5]);
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            actor.addParam(this._params[2], value);
        });
        return true;
    }

    // Change Skill
    command318(): boolean {
        this.iterateActorEx(this._params[0], this._params[1], (actor) => {
            if (this._params[2] === 0) {
                actor.learnSkill(this._params[3]);
            } else {
                actor.forgetSkill(this._params[3]);
            }
        });
        return true;
    }

    // Change Equipment
    command319(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.changeEquipById(this._params[1], this._params[2]);
        }
        return true;
    }

    // Change Name
    command320(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setName(this._params[1]);
        }
        return true;
    }

    // Change Class
    command321(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor && window.$dataClasses[this._params[1]]) {
            actor.changeClass(this._params[1], this._params[2]);
        }
        return true;
    }

    // Change Actor Images
    command322(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setCharacterImage(this._params[1], this._params[2]);
            actor.setFaceImage(this._params[3], this._params[4]);
            actor.setBattlerImage(this._params[5]);
        }
        window.$gamePlayer.refresh();
        return true;
    }

    // Change Vehicle Image
    command323(): boolean {
        const vehicle = window.$gameMap.vehicle(this._params[0]);
        if (vehicle) {
            vehicle.setImage(this._params[1], this._params[2]);
        }
        return true;
    }

    // Change Nickname
    command324(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setNickname(this._params[1]);
        }
        return true;
    }

    // Change Profile
    command325(): boolean {
        const actor = window.$gameActors.actor(this._params[0]);
        if (actor) {
            actor.setProfile(this._params[1]);
        }
        return true;
    }

    // Change Enemy HP
    command331(): boolean {
        const value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            this.changeHp(enemy, value, this._params[4]);
        });
        return true;
    }

    // Change Enemy MP
    command332(): boolean {
        const value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            enemy.gainMp(value);
        });
        return true;
    }

    // Change Enemy TP
    command342(): boolean {
        const value = this.operateValue(this._params[1], this._params[2], this._params[3]);
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            enemy.gainTp(value);
        });
        return true;
    }

    // Change Enemy State
    command333(): boolean {
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            const alreadyDead = enemy.isDead();
            if (this._params[1] === 0) {
                enemy.addState(this._params[2]);
            } else {
                enemy.removeState(this._params[2]);
            }
            if (enemy.isDead() && !alreadyDead) {
                enemy.performCollapse();
            }
            enemy.clearResult();
        });
        return true;
    }

    // Enemy Recover All
    command334(): boolean {
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            enemy.recoverAll();
        });
        return true;
    }

    // Enemy Appear
    command335(): boolean {
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            enemy.appear();
            window.$gameTroop.makeUniqueNames();
        });
        return true;
    }

    // Enemy Transform
    command336(): boolean {
        this.iterateEnemyIndex(this._params[0], (enemy) => {
            enemy.transform(this._params[1]);
            window.$gameTroop.makeUniqueNames();
        });
        return true;
    }

    // Show Battle Animation
    command337(): boolean {
        if (this._params[2] == true) {
            this.iterateEnemyIndex(-1, (enemy) => {
                if (enemy.isAlive()) {
                    enemy.startAnimation(this._params[1], false, 0);
                }
            });
        } else {
            this.iterateEnemyIndex(this._params[0], (enemy) => {
                if (enemy.isAlive()) {
                    enemy.startAnimation(this._params[1], false, 0);
                }
            });
        }
        return true;
    }

    // Force Action
    command339(): boolean {
        this.iterateBattler(this._params[0], this._params[1], (battler) => {
            if (!battler.isDeathStateAffected()) {
                battler.forceAction(this._params[2], this._params[3]);
                BattleManager.forceAction(battler);
                this.setWaitMode('action');
            }
        });
        return true;
    }

    // Abort Battle
    command340(): boolean {
        BattleManager.abort();
        return true;
    }

    // Open Menu Screen
    command351(): boolean {
        if (!window.$gameParty.inBattle()) {
            SceneManager.push(Scene_Menu);
            Window_MenuCommand.initCommandPosition();
        }
        return true;
    }

    // Open Save Screen
    command352(): boolean {
        if (!window.$gameParty.inBattle()) {
            SceneManager.push(Scene_Save);
        }
        return true;
    }

    // Game Over
    command353(): boolean {
        SceneManager.goto(Scene_Gameover);
        return true;
    }

    // Return to Title Screen
    command354(): boolean {
        SceneManager.goto(Scene_Title);
        return true;
    }

    // Script
    command355(): boolean {
        const startLine = this._index + 1;
        let script = this.currentCommand().parameters[0] + '\n';
        while (this.nextEventCode() === 655) {
            this._index++;
            script += this.currentCommand().parameters[0] + '\n';
        }
        const endLine = this._index + 1;
        try {
            eval(script);
        } catch (error) {
            error.line = startLine + '-' + endLine;
            error.eventCommand = 'script';
            error.content = script;
            throw error;
        }
        return true;
    }

    // Plugin Command
    command356(): boolean {
        const args = this._params[0].split(' ');
        const command = args.shift();
        try {
            this.pluginCommand(command, args);
        } catch (error) {
            error.eventCommand = 'plugin_command';
            error.content = this._params[0];
            throw error;
        }
        return true;
    }

    pluginCommand(_command: RPGEventCommand, _args: unknown[]): void {
        // to be overridden by plugins
    }

    static requestImagesByPluginCommand(_command: RPGEventCommand, _args: unknown[]): void {
        // to be overridden by plugins
    }

    static requestImagesForCommand(command: RPGEventCommand): void {
        const params = command.parameters;
        switch (command.code) {
            // Show Text
            case 101:
                ImageManager.requestFace(params[0]);
                break;

            // Change Party Member
            case 129: {
                const actor = window.$gameActors.actor(params[0]);
                if (actor && params[1] === 0) {
                    const name = actor.characterName();
                    ImageManager.requestCharacter(name);
                }
                break;
            }

            // Set Movement Route
            case 205:
                if (params[1]) {
                    (params[1] as RPGMoveRoute).list.forEach((command) => {
                        const params = command.parameters;
                        if (command.code === Game_Character.ROUTE_CHANGE_IMAGE) {
                            ImageManager.requestCharacter(params[0]);
                        }
                    });
                }
                break;

            // Show Animation, Show Battle Animation
            case 212:
            case 337:
                if (params[1]) {
                    const animation = window.$dataAnimations[params[1]];
                    const name1 = animation.animation1Name;
                    const name2 = animation.animation2Name;
                    const hue1 = animation.animation1Hue;
                    const hue2 = animation.animation2Hue;
                    ImageManager.requestAnimation(name1, hue1);
                    ImageManager.requestAnimation(name2, hue2);
                }
                break;

            // Change Player Followers
            case 216:
                if (params[0] === 0) {
                    window.$gamePlayer.followers().forEach((follower) => {
                        const name = follower.characterName();
                        ImageManager.requestCharacter(name);
                    });
                }
                break;

            // Show Picture
            case 231:
                ImageManager.requestPicture(params[1]);
                break;

            // Change Tileset
            case 282: {
                const tileset = window.$dataTilesets[params[0]];
                tileset.tilesetNames.forEach((tilesetName) => {
                    ImageManager.requestTileset(tilesetName);
                });
                break;
            }

            // Change Battle Back
            case 283:
                if (window.$gameParty.inBattle()) {
                    ImageManager.requestBattleback1(params[0]);
                    ImageManager.requestBattleback2(params[1]);
                }
                break;

            // Change Parallax
            case 284:
                if (!window.$gameParty.inBattle()) {
                    ImageManager.requestParallax(params[0]);
                }
                break;

            // Change Actor Images
            case 322:
                ImageManager.requestCharacter(params[1]);
                ImageManager.requestFace(params[3]);
                ImageManager.requestSvActor(params[5]);
                break;

            // Change Vehicle Image
            case 323: {
                const vehicle = window.$gameMap.vehicle(params[0]);
                if (vehicle) {
                    ImageManager.requestCharacter(params[1]);
                }
                break;
            }

            // Enemy Transform
            case 336: {
                const enemy = window.$dataEnemies[params[1]];
                const name = enemy.battlerName;
                const hue = enemy.battlerHue;
                if (window.$gameSystem.isSideView()) {
                    ImageManager.requestSvEnemy(name, hue);
                } else {
                    ImageManager.requestEnemy(name, hue);
                }
                break;
            }
            // Plugin Command
            case 356: {
                const args = params[0].split(' ');
                const commandName = args.shift();
                Game_Interpreter.requestImagesByPluginCommand(commandName, args);
                break;
            }
        }
    }

    static requestImagesByChildEvent(command: RPGEventCommand, commonList: unknown[] = []): void {
        const params = command.parameters;
        const commonEvent = window.$dataCommonEvents[params[0]];
        if (commonEvent) {
            if (!commonList) {
                commonList = [];
            }
            if (!commonList.includes(params[0])) {
                commonList.push(params[0]);
                Game_Interpreter.requestImages(commonEvent.list, commonList);
            }
        }
    }

    static requestImages(list: readonly RPGEventCommand[], commonList: unknown[] = []): void {
        if (!list) {
            return;
        }
        const len = list.length;
        for (let i = 0; i < len; i += 1) {
            const command = list[i];
            // Common Event
            if (command.code === 117) {
                Game_Interpreter.requestImagesByChildEvent(command, commonList);
            } else {
                Game_Interpreter.requestImagesForCommand(command);
            }
        }
    }
}
