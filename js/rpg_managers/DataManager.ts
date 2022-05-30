/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceHandler } from '../rpg_core/ResourceHandler';
import { JsonEx } from '../rpg_core/JsonEx';
import { Utils } from '../rpg_core/Utils';
import { Decrypter } from '../rpg_core/Decrypter';
import { Graphics } from '../rpg_core/Graphics';

import { Game_Temp } from '../rpg_objects/Game_Temp';
import { Game_System } from '../rpg_objects/Game_System';
import { Game_Screen } from '../rpg_objects/Game_Screen';
import { Game_Timer } from '../rpg_objects/Game_Timer';
import { Game_Message } from '../rpg_objects/Game_Message';
import { Game_Switches } from '../rpg_objects/Game_Switches';
import { Game_Variables } from '../rpg_objects/Game_Variables';
import { Game_SelfSwitches } from '../rpg_objects/Game_SelfSwitches';
import { Game_Actors } from '../rpg_objects/Game_Actors';
import { Game_Party } from '../rpg_objects/Game_Party';
import { Game_Troop } from '../rpg_objects/Game_Troop';
import { Game_Map } from '../rpg_objects/Game_Map';
import { Game_Player } from '../rpg_objects/Game_Player';

import type { RPGSkill } from '../rpg_data/skill';
import type { RPGItem } from '../rpg_data/item';
import type { RPGWeapon } from '../rpg_data/weapon';
import type { RPGArmor } from '../rpg_data/armor';

import { Scene_Boot } from '../rpg_scenes/Scene_Boot';

import { BattleManager } from './BattleManager';
import { ImageManager } from './ImageManager';
import { SceneManager } from './SceneManager';
import { StorageManager } from './StorageManager';

window.$dataActors = null;
window.$dataClasses = null;
window.$dataSkills = null;
window.$dataItems = null;
window.$dataWeapons = null;
window.$dataArmors = null;
window.$dataEnemies = null;
window.$dataTroops = null;
window.$dataStates = null;
window.$dataAnimations = null;
window.$dataTilesets = null;
window.$dataCommonEvents = null;
window.$dataSystem = null;
window.$dataMapInfos = null;
window.$dataMap = null;

window.$gameTemp = null;
window.$gameSystem = null;
window.$gameScreen = null;
window.$gameTimer = null;
window.$gameMessage = null;
window.$gameSwitches = null;
window.$gameVariables = null;
window.$gameSelfSwitches = null;
window.$gameActors = null;
window.$gameParty = null;
window.$gameTroop = null;
window.$gameMap = null;
window.$gamePlayer = null;

window.$testEvent = null;

export type SaveInfo = {
    globalId: string;
    title: string;
    characters: [string, number][];
    faces: [string, number][];
    playtime: string;
    timestamp: number;
};

type SaveContent = {
    readonly system: Game_System;
    readonly screen: Game_Screen;
    readonly timer: Game_Timer;
    readonly switches: Game_Switches;
    readonly variables: Game_Variables;
    readonly selfSwitches: Game_SelfSwitches;
    readonly actors: Game_Actors;
    readonly party: Game_Party;
    readonly map: Game_Map;
    readonly player: Game_Player;
};

type DatabaseEntry =
    | '$dataActors'
    | '$dataClasses'
    | '$dataSkills'
    | '$dataItems'
    | '$dataWeapons'
    | '$dataArmors'
    | '$dataEnemies'
    | '$dataTroops'
    | '$dataStates'
    | '$dataAnimations'
    | '$dataTilesets'
    | '$dataCommonEvents'
    | '$dataSystem'
    | '$dataMapInfos'
    | '$dataMap'
    | '$testEvent';

/**
 * The static class that manages the database and game objects.
 */
export const DataManager = new (class DataManager {
    private readonly _globalId = 'RPGMV';
    private _lastAccessedId = 1;
    private _errorUrl: string = null;
    private _autoSaveFileId = 0;
    private _mapLoader?: () => void;
    private _globalInfo?: SaveInfo[];

    private readonly _databaseFiles: { name: DatabaseEntry; src: string }[] = [
        { name: '$dataActors', src: 'Actors.json' },
        { name: '$dataClasses', src: 'Classes.json' },
        { name: '$dataSkills', src: 'Skills.json' },
        { name: '$dataItems', src: 'Items.json' },
        { name: '$dataWeapons', src: 'Weapons.json' },
        { name: '$dataArmors', src: 'Armors.json' },
        { name: '$dataEnemies', src: 'Enemies.json' },
        { name: '$dataTroops', src: 'Troops.json' },
        { name: '$dataStates', src: 'States.json' },
        { name: '$dataAnimations', src: 'Animations.json' },
        { name: '$dataTilesets', src: 'Tilesets.json' },
        { name: '$dataCommonEvents', src: 'CommonEvents.json' },
        { name: '$dataSystem', src: 'System.json' },
        { name: '$dataMapInfos', src: 'MapInfos.json' },
    ];

    loadDatabase(): void {
        const test = this.isBattleTest() || this.isEventTest();
        const prefix = test ? 'Test_' : '';
        for (let i = 0; i < this._databaseFiles.length; i++) {
            const name = this._databaseFiles[i].name;
            const src = this._databaseFiles[i].src;
            this.loadDataFile(name, prefix + src);
        }
        if (this.isEventTest()) {
            this.loadDataFile('$testEvent', prefix + 'Event.json');
        }
    }

    loadDataFile(name: DatabaseEntry, src: string): void {
        const xhr = new XMLHttpRequest();
        const url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = () => {
            if (xhr.status < 400) {
                window[name] = JSON.parse(xhr.responseText);
                this.onLoad(window[name]);
            }
        };
        xhr.onerror =
            this._mapLoader ||
            (() => {
                this._errorUrl = this._errorUrl || url;
            });
        window[name] = null;
        xhr.send();
    }

    isDatabaseLoaded(): boolean {
        this.checkError();
        for (let i = 0; i < this._databaseFiles.length; i++) {
            if (!window[this._databaseFiles[i].name]) {
                return false;
            }
        }
        return true;
    }

    loadMapData(mapId: number): void {
        if (mapId > 0) {
            const filename = `Map${String(mapId).padStart(3, '0')}.json`;
            this._mapLoader = ResourceHandler.createLoader(
                'data/' + filename,
                this.loadDataFile.bind(this, '$dataMap', filename)
            );
            this.loadDataFile('$dataMap', filename);
        } else {
            this.makeEmptyMap();
        }
    }

    makeEmptyMap(): void {
        window.$dataMap = {
            data: [],
            events: [],
            width: 100,
            height: 100,
            scrollType: 3,
        } as any;
    }

    isMapLoaded(): boolean {
        this.checkError();
        return !!window.$dataMap;
    }

    onLoad(object: any): void {
        let array;
        if (object === window.$dataMap) {
            this.extractMetadata(object);
            array = object.events;
        } else {
            array = object;
        }
        if (Array.isArray(array)) {
            for (let i = 0; i < array.length; i++) {
                const data = array[i];
                if (data && data.note !== undefined) {
                    this.extractMetadata(data);
                }
            }
        }
        if (object === window.$dataSystem) {
            Decrypter.hasEncryptedImages = !!object.hasEncryptedImages;
            Decrypter.hasEncryptedAudio = !!object.hasEncryptedAudio;
            Scene_Boot.loadSystemImages();
        }
    }

    extractMetadata(data: any): void {
        const re = /<([^<>:]+)(:?)([^>]*)>/g;
        data.meta = {};
        for (;;) {
            const match = re.exec(data.note);
            if (match) {
                if (match[2] === ':') {
                    data.meta[match[1]] = match[3];
                } else {
                    data.meta[match[1]] = true;
                }
            } else {
                break;
            }
        }
    }

    checkError(): void {
        if (this._errorUrl) {
            throw new Error('Failed to load: ' + this._errorUrl);
        }
    }

    isBattleTest(): boolean {
        return Utils.isOptionValid('btest');
    }

    isEventTest(): boolean {
        return Utils.isOptionValid('etest');
    }

    isSkill(item: unknown): item is RPGSkill {
        return item && window.$dataSkills.includes(item as RPGSkill);
    }

    isItem(item: unknown): item is RPGItem {
        return item && window.$dataItems.includes(item as RPGItem);
    }

    isWeapon(item: unknown): item is RPGWeapon {
        return item && window.$dataWeapons.includes(item as RPGWeapon);
    }

    isArmor(item: unknown): item is RPGArmor {
        return item && window.$dataArmors.includes(item as RPGArmor);
    }

    createGameObjects(): void {
        window.$gameTemp = new Game_Temp();
        window.$gameSystem = new Game_System();
        window.$gameScreen = new Game_Screen();
        window.$gameTimer = new Game_Timer();
        window.$gameMessage = new Game_Message();
        window.$gameSwitches = new Game_Switches();
        window.$gameVariables = new Game_Variables();
        window.$gameSelfSwitches = new Game_SelfSwitches();
        window.$gameActors = new Game_Actors();
        window.$gameParty = new Game_Party();
        window.$gameTroop = new Game_Troop();
        window.$gameMap = new Game_Map();
        window.$gamePlayer = new Game_Player();
    }

    setupNewGame(): void {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        window.$gameParty.setupStartingMembers();
        window.$gamePlayer.reserveTransfer(
            window.$dataSystem.startMapId,
            window.$dataSystem.startX,
            window.$dataSystem.startY
        );
        Graphics.frameCount = 0;
        SceneManager.resetFrameCount();
    }

    setupBattleTest(): void {
        this.createGameObjects();
        window.$gameParty.setupBattleTest();
        BattleManager.setup(window.$dataSystem.testTroopId, true, false);
        BattleManager.setBattleTest(true);
        BattleManager.playBattleBgm();
    }

    setupEventTest(): void {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        window.$gameParty.setupStartingMembers();
        window.$gamePlayer.reserveTransfer(-1, 8, 6);
        window.$gamePlayer.setTransparent(false);
    }

    loadGlobalInfo(): SaveInfo[] {
        if (this._globalInfo) {
            return this._globalInfo;
        }
        let json;
        try {
            json = StorageManager.load(0);
        } catch (e) {
            console.error(e);
            return [];
        }
        if (json) {
            this._globalInfo = JSON.parse(json);
            for (let i = 1; i <= this.maxSavefiles(); i++) {
                if (!StorageManager.exists(i)) {
                    delete this._globalInfo[i];
                }
            }
            return this._globalInfo;
        } else {
            return (this._globalInfo = []);
        }
    }

    saveGlobalInfo(info: readonly SaveInfo[]): void {
        this._globalInfo = null;
        StorageManager.save(0, JSON.stringify(info));
    }

    isThisGameFile(savefileId: number): boolean {
        const globalInfo = this.loadGlobalInfo();
        if (globalInfo && globalInfo[savefileId]) {
            if (StorageManager.isLocalMode()) {
                return true;
            } else {
                const savefile = globalInfo[savefileId];
                return savefile.globalId === this._globalId && savefile.title === window.$dataSystem.gameTitle;
            }
        } else {
            return false;
        }
    }

    isAnySavefileExists(): boolean {
        const globalInfo = this.loadGlobalInfo();
        if (globalInfo) {
            for (let i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i)) {
                    return true;
                }
            }
        }
        return false;
    }

    latestSavefileId(): number {
        const globalInfo = this.loadGlobalInfo();
        let savefileId = 1;
        let timestamp = 0;
        if (globalInfo) {
            for (let i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
                    timestamp = globalInfo[i].timestamp;
                    savefileId = i;
                }
            }
        }
        return savefileId;
    }

    loadAllSavefileImages(): void {
        const globalInfo = this.loadGlobalInfo();
        if (globalInfo) {
            for (let i = 1; i < globalInfo.length; i++) {
                if (this.isThisGameFile(i)) {
                    const info = globalInfo[i];
                    this.loadSavefileImages(info);
                }
            }
        }
    }

    loadSavefileImages(info: SaveInfo): void {
        if (info.characters) {
            for (let i = 0; i < info.characters.length; i++) {
                ImageManager.reserveCharacter(info.characters[i][0]);
            }
        }
        if (info.faces) {
            for (let j = 0; j < info.faces.length; j++) {
                ImageManager.reserveFace(info.faces[j][0]);
            }
        }
    }

    maxSavefiles(): number {
        return 20;
    }

    saveGame(savefileId: number): boolean {
        try {
            StorageManager.backup(savefileId);
            return this.saveGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            try {
                StorageManager.remove(savefileId);
                StorageManager.restoreBackup(savefileId);
            } catch (e2) {
                // ...
            }
            return false;
        }
    }

    loadGame(savefileId: number): boolean {
        try {
            return this.loadGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    loadSavefileInfo(savefileId: number) {
        const globalInfo = this.loadGlobalInfo();
        return globalInfo && globalInfo[savefileId] ? globalInfo[savefileId] : null;
    }

    lastAccessedSavefileId(): number {
        return this._lastAccessedId;
    }

    saveGameWithoutRescue(savefileId: number): boolean {
        const json = JsonEx.stringify(this.makeSaveContents());
        if (json.length >= 200000) {
            console.warn('Save data too big!');
        }
        StorageManager.save(savefileId, json);
        this._lastAccessedId = savefileId;
        const globalInfo = this.loadGlobalInfo() || [];
        globalInfo[savefileId] = this.makeSavefileInfo();
        this.saveGlobalInfo(globalInfo);
        return true;
    }

    loadGameWithoutRescue(savefileId: number): boolean {
        if (this.isThisGameFile(savefileId)) {
            const json = StorageManager.load(savefileId);
            this.createGameObjects();
            this.extractSaveContents(JsonEx.parse(json));
            this._lastAccessedId = savefileId;
            return true;
        } else {
            return false;
        }
    }

    selectSavefileForNewGame(): void {
        const globalInfo = this.loadGlobalInfo();
        this._lastAccessedId = 1;
        if (globalInfo) {
            const numSavefiles = Math.max(0, globalInfo.length - 1);
            if (numSavefiles < this.maxSavefiles()) {
                this._lastAccessedId = numSavefiles + 1;
            } else {
                let timestamp = Number.MAX_VALUE;
                for (let i = 1; i < globalInfo.length; i++) {
                    if (!globalInfo[i]) {
                        this._lastAccessedId = i;
                        break;
                    }
                    if (globalInfo[i].timestamp < timestamp) {
                        timestamp = globalInfo[i].timestamp;
                        this._lastAccessedId = i;
                    }
                }
            }
        }
    }

    makeSavefileInfo(): SaveInfo {
        return {
            globalId: this._globalId,
            title: window.$dataSystem.gameTitle,
            characters: window.$gameParty.charactersForSavefile(),
            faces: window.$gameParty.facesForSavefile(),
            playtime: window.$gameSystem.playtimeText(),
            timestamp: Date.now(),
        };
    }

    makeSaveContents(): SaveContent {
        // A save data does not contain window.$gameTemp, window.$gameMessage, and window.$gameTroop.
        return {
            system: window.$gameSystem,
            screen: window.$gameScreen,
            timer: window.$gameTimer,
            switches: window.$gameSwitches,
            variables: window.$gameVariables,
            selfSwitches: window.$gameSelfSwitches,
            actors: window.$gameActors,
            party: window.$gameParty,
            map: window.$gameMap,
            player: window.$gamePlayer,
        };
    }

    extractSaveContents(contents: SaveContent) {
        window.$gameSystem = contents.system;
        window.$gameScreen = contents.screen;
        window.$gameTimer = contents.timer;
        window.$gameSwitches = contents.switches;
        window.$gameVariables = contents.variables;
        window.$gameSelfSwitches = contents.selfSwitches;
        window.$gameActors = contents.actors;
        window.$gameParty = contents.party;
        window.$gameMap = contents.map;
        window.$gamePlayer = contents.player;
    }

    setAutoSaveFileId(autoSaveFileId: number): void {
        this._autoSaveFileId = autoSaveFileId;
    }

    isAutoSaveFileId(saveFileId: number): boolean {
        return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
    }

    autoSaveGame() {
        if (this._autoSaveFileId !== 0 && !this.isEventTest() && window.$gameSystem.isSaveEnabled()) {
            window.$gameSystem.onBeforeSave();
            if (this.saveGame(this._autoSaveFileId)) {
                StorageManager.cleanBackup(this._autoSaveFileId);
            }
        }
    }
})();
