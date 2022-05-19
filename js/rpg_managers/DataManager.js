import { ResourceHandler } from '../rpg_core/ResourceHandler';
import { JsonEx } from '../rpg_core/JsonEx';
import { Utils } from '../rpg_core/Utils';
import { Decrypter } from '../rpg_core/Decrypter';
import { Graphics } from '../rpg_core/Graphics';

import { SceneManager } from '../rpg_managers/SceneManager';
import { BattleManager } from '../rpg_managers/BattleManager';
import { ImageManager } from '../rpg_managers/ImageManager';

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

import { Scene_Boot } from '../rpg_scenes/Scene_Boot';
import { StorageManager } from './StorageManager';

global.$dataActors = null;
global.$dataClasses = null;
global.$dataSkills = null;
global.$dataItems = null;
global.$dataWeapons = null;
global.$dataArmors = null;
global.$dataEnemies = null;
global.$dataTroops = null;
global.$dataStates = null;
global.$dataAnimations = null;
global.$dataTilesets = null;
global.$dataCommonEvents = null;
global.$dataSystem = null;
global.$dataMapInfos = null;
global.$dataMap = null;
global.$gameTemp = null;
global.$gameSystem = null;
global.$gameScreen = null;
global.$gameTimer = null;
global.$gameMessage = null;
global.$gameSwitches = null;
global.$gameVariables = null;
global.$gameSelfSwitches = null;
global.$gameActors = null;
global.$gameParty = null;
global.$gameTroop = null;
global.$gameMap = null;
global.$gamePlayer = null;
global.$testEvent = null;

/**
 * The static class that manages the database and game objects.
 */
export const DataManager = new (class DataManager {
    _globalId = 'RPGMV';
    _lastAccessedId = 1;
    _errorUrl = null;
    _autoSaveFileId = 0;

    _databaseFiles = [
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

    loadDatabase() {
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

    loadDataFile(name, src) {
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

    isDatabaseLoaded() {
        this.checkError();
        for (let i = 0; i < this._databaseFiles.length; i++) {
            if (!window[this._databaseFiles[i].name]) {
                return false;
            }
        }
        return true;
    }

    loadMapData(mapId) {
        if (mapId > 0) {
            const filename = 'Map%1.json'.format(mapId.padZero(3));
            this._mapLoader = ResourceHandler.createLoader(
                'data/' + filename,
                this.loadDataFile.bind(this, '$dataMap', filename)
            );
            this.loadDataFile('$dataMap', filename);
        } else {
            this.makeEmptyMap();
        }
    }

    makeEmptyMap() {
        global.$dataMap = {};
        global.$dataMap.data = [];
        global.$dataMap.events = [];
        global.$dataMap.width = 100;
        global.$dataMap.height = 100;
        global.$dataMap.scrollType = 3;
    }

    isMapLoaded() {
        this.checkError();
        return !!global.$dataMap;
    }

    onLoad(object) {
        let array;
        if (object === global.$dataMap) {
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
        if (object === global.$dataSystem) {
            Decrypter.hasEncryptedImages = !!object.hasEncryptedImages;
            Decrypter.hasEncryptedAudio = !!object.hasEncryptedAudio;
            Scene_Boot.loadSystemImages();
        }
    }

    extractMetadata(data) {
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

    checkError() {
        if (this._errorUrl) {
            throw new Error('Failed to load: ' + this._errorUrl);
        }
    }

    isBattleTest() {
        return Utils.isOptionValid('btest');
    }

    isEventTest() {
        return Utils.isOptionValid('etest');
    }

    isSkill(item) {
        return item && global.$dataSkills.contains(item);
    }

    isItem(item) {
        return item && global.$dataItems.contains(item);
    }

    isWeapon(item) {
        return item && global.$dataWeapons.contains(item);
    }

    isArmor(item) {
        return item && global.$dataArmors.contains(item);
    }

    createGameObjects() {
        global.$gameTemp = new Game_Temp();
        global.$gameSystem = new Game_System();
        global.$gameScreen = new Game_Screen();
        global.$gameTimer = new Game_Timer();
        global.$gameMessage = new Game_Message();
        global.$gameSwitches = new Game_Switches();
        global.$gameVariables = new Game_Variables();
        global.$gameSelfSwitches = new Game_SelfSwitches();
        global.$gameActors = new Game_Actors();
        global.$gameParty = new Game_Party();
        global.$gameTroop = new Game_Troop();
        global.$gameMap = new Game_Map();
        global.$gamePlayer = new Game_Player();
    }

    setupNewGame() {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        global.$gameParty.setupStartingMembers();
        global.$gamePlayer.reserveTransfer(
            global.$dataSystem.startMapId,
            global.$dataSystem.startX,
            global.$dataSystem.startY
        );
        Graphics.frameCount = 0;
        SceneManager.resetFrameCount();
    }

    setupBattleTest() {
        this.createGameObjects();
        global.$gameParty.setupBattleTest();
        BattleManager.setup(global.$dataSystem.testTroopId, true, false);
        BattleManager.setBattleTest(true);
        BattleManager.playBattleBgm();
    }

    setupEventTest() {
        this.createGameObjects();
        this.selectSavefileForNewGame();
        global.$gameParty.setupStartingMembers();
        global.$gamePlayer.reserveTransfer(-1, 8, 6);
        global.$gamePlayer.setTransparent(false);
    }

    loadGlobalInfo() {
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

    saveGlobalInfo(info) {
        this._globalInfo = null;
        StorageManager.save(0, JSON.stringify(info));
    }

    isThisGameFile(savefileId) {
        const globalInfo = this.loadGlobalInfo();
        if (globalInfo && globalInfo[savefileId]) {
            if (StorageManager.isLocalMode()) {
                return true;
            } else {
                const savefile = globalInfo[savefileId];
                return savefile.globalId === this._globalId && savefile.title === global.$dataSystem.gameTitle;
            }
        } else {
            return false;
        }
    }

    isAnySavefileExists() {
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

    latestSavefileId() {
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

    loadAllSavefileImages() {
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

    loadSavefileImages(info) {
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

    maxSavefiles() {
        return 20;
    }

    saveGame(savefileId) {
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

    loadGame(savefileId) {
        try {
            return this.loadGameWithoutRescue(savefileId);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    loadSavefileInfo(savefileId) {
        const globalInfo = this.loadGlobalInfo();
        return globalInfo && globalInfo[savefileId] ? globalInfo[savefileId] : null;
    }

    lastAccessedSavefileId() {
        return this._lastAccessedId;
    }

    saveGameWithoutRescue(savefileId) {
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

    loadGameWithoutRescue(savefileId) {
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

    selectSavefileForNewGame() {
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

    makeSavefileInfo() {
        const info = {};
        info.globalId = this._globalId;
        info.title = global.$dataSystem.gameTitle;
        info.characters = global.$gameParty.charactersForSavefile();
        info.faces = global.$gameParty.facesForSavefile();
        info.playtime = global.$gameSystem.playtimeText();
        info.timestamp = Date.now();
        return info;
    }

    makeSaveContents() {
        // A save data does not contain global.$gameTemp, global.$gameMessage, and global.$gameTroop.
        const contents = {};
        contents.system = global.$gameSystem;
        contents.screen = global.$gameScreen;
        contents.timer = global.$gameTimer;
        contents.switches = global.$gameSwitches;
        contents.variables = global.$gameVariables;
        contents.selfSwitches = global.$gameSelfSwitches;
        contents.actors = global.$gameActors;
        contents.party = global.$gameParty;
        contents.map = global.$gameMap;
        contents.player = global.$gamePlayer;
        return contents;
    }

    extractSaveContents(contents) {
        global.$gameSystem = contents.system;
        global.$gameScreen = contents.screen;
        global.$gameTimer = contents.timer;
        global.$gameSwitches = contents.switches;
        global.$gameVariables = contents.variables;
        global.$gameSelfSwitches = contents.selfSwitches;
        global.$gameActors = contents.actors;
        global.$gameParty = contents.party;
        global.$gameMap = contents.map;
        global.$gamePlayer = contents.player;
    }

    setAutoSaveFileId(autoSaveFileId) {
        this._autoSaveFileId = autoSaveFileId;
    }

    isAutoSaveFileId(saveFileId) {
        return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
    }

    autoSaveGame() {
        if (this._autoSaveFileId !== 0 && !this.isEventTest() && global.$gameSystem.isSaveEnabled()) {
            global.$gameSystem.onBeforeSave();
            if (this.saveGame(this._autoSaveFileId)) {
                StorageManager.cleanBackup(this._autoSaveFileId);
            }
        }
    }
})();
