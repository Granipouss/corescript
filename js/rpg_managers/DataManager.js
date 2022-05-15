//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.

function DataManager() {
    throw new Error('This is a static class');
}

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

DataManager._globalId = 'RPGMV';
DataManager._lastAccessedId = 1;
DataManager._errorUrl = null;
DataManager._autoSaveFileId = 0;

DataManager._databaseFiles = [
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

DataManager.loadDatabase = function () {
    var test = this.isBattleTest() || this.isEventTest();
    var prefix = test ? 'Test_' : '';
    for (var i = 0; i < this._databaseFiles.length; i++) {
        var name = this._databaseFiles[i].name;
        var src = this._databaseFiles[i].src;
        this.loadDataFile(name, prefix + src);
    }
    if (this.isEventTest()) {
        this.loadDataFile('$testEvent', prefix + 'Event.json');
    }
};

DataManager.loadDataFile = function (name, src) {
    var xhr = new XMLHttpRequest();
    var url = 'data/' + src;
    xhr.open('GET', url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function () {
        if (xhr.status < 400) {
            window[name] = JSON.parse(xhr.responseText);
            DataManager.onLoad(window[name]);
        }
    };
    xhr.onerror =
        this._mapLoader ||
        function () {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
    window[name] = null;
    xhr.send();
};

DataManager.isDatabaseLoaded = function () {
    this.checkError();
    for (var i = 0; i < this._databaseFiles.length; i++) {
        if (!window[this._databaseFiles[i].name]) {
            return false;
        }
    }
    return true;
};

DataManager.loadMapData = function (mapId) {
    if (mapId > 0) {
        var filename = 'Map%1.json'.format(mapId.padZero(3));
        this._mapLoader = ResourceHandler.createLoader(
            'data/' + filename,
            this.loadDataFile.bind(this, '$dataMap', filename)
        );
        this.loadDataFile('$dataMap', filename);
    } else {
        this.makeEmptyMap();
    }
};

DataManager.makeEmptyMap = function () {
    global.$dataMap = {};
    global.$dataMap.data = [];
    global.$dataMap.events = [];
    global.$dataMap.width = 100;
    global.$dataMap.height = 100;
    global.$dataMap.scrollType = 3;
};

DataManager.isMapLoaded = function () {
    this.checkError();
    return !!global.$dataMap;
};

DataManager.onLoad = function (object) {
    var array;
    if (object === global.$dataMap) {
        this.extractMetadata(object);
        array = object.events;
    } else {
        array = object;
    }
    if (Array.isArray(array)) {
        for (var i = 0; i < array.length; i++) {
            var data = array[i];
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
};

DataManager.extractMetadata = function (data) {
    var re = /<([^<>:]+)(:?)([^>]*)>/g;
    data.meta = {};
    for (;;) {
        var match = re.exec(data.note);
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
};

DataManager.checkError = function () {
    if (DataManager._errorUrl) {
        throw new Error('Failed to load: ' + DataManager._errorUrl);
    }
};

DataManager.isBattleTest = function () {
    return Utils.isOptionValid('btest');
};

DataManager.isEventTest = function () {
    return Utils.isOptionValid('etest');
};

DataManager.isSkill = function (item) {
    return item && global.$dataSkills.contains(item);
};

DataManager.isItem = function (item) {
    return item && global.$dataItems.contains(item);
};

DataManager.isWeapon = function (item) {
    return item && global.$dataWeapons.contains(item);
};

DataManager.isArmor = function (item) {
    return item && global.$dataArmors.contains(item);
};

DataManager.createGameObjects = function () {
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
};

DataManager.setupNewGame = function () {
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
};

DataManager.setupBattleTest = function () {
    this.createGameObjects();
    global.$gameParty.setupBattleTest();
    BattleManager.setup(global.$dataSystem.testTroopId, true, false);
    BattleManager.setBattleTest(true);
    BattleManager.playBattleBgm();
};

DataManager.setupEventTest = function () {
    this.createGameObjects();
    this.selectSavefileForNewGame();
    global.$gameParty.setupStartingMembers();
    global.$gamePlayer.reserveTransfer(-1, 8, 6);
    global.$gamePlayer.setTransparent(false);
};

DataManager.loadGlobalInfo = function () {
    if (this._globalInfo) {
        return this._globalInfo;
    }
    var json;
    try {
        json = StorageManager.load(0);
    } catch (e) {
        console.error(e);
        return [];
    }
    if (json) {
        this._globalInfo = JSON.parse(json);
        for (var i = 1; i <= this.maxSavefiles(); i++) {
            if (!StorageManager.exists(i)) {
                delete this._globalInfo[i];
            }
        }
        return this._globalInfo;
    } else {
        return (this._globalInfo = []);
    }
};

DataManager.saveGlobalInfo = function (info) {
    this._globalInfo = null;
    StorageManager.save(0, JSON.stringify(info));
};

DataManager.isThisGameFile = function (savefileId) {
    var globalInfo = this.loadGlobalInfo();
    if (globalInfo && globalInfo[savefileId]) {
        if (StorageManager.isLocalMode()) {
            return true;
        } else {
            var savefile = globalInfo[savefileId];
            return savefile.globalId === this._globalId && savefile.title === global.$dataSystem.gameTitle;
        }
    } else {
        return false;
    }
};

DataManager.isAnySavefileExists = function () {
    var globalInfo = this.loadGlobalInfo();
    if (globalInfo) {
        for (var i = 1; i < globalInfo.length; i++) {
            if (this.isThisGameFile(i)) {
                return true;
            }
        }
    }
    return false;
};

DataManager.latestSavefileId = function () {
    var globalInfo = this.loadGlobalInfo();
    var savefileId = 1;
    var timestamp = 0;
    if (globalInfo) {
        for (var i = 1; i < globalInfo.length; i++) {
            if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
                timestamp = globalInfo[i].timestamp;
                savefileId = i;
            }
        }
    }
    return savefileId;
};

DataManager.loadAllSavefileImages = function () {
    var globalInfo = this.loadGlobalInfo();
    if (globalInfo) {
        for (var i = 1; i < globalInfo.length; i++) {
            if (this.isThisGameFile(i)) {
                var info = globalInfo[i];
                this.loadSavefileImages(info);
            }
        }
    }
};

DataManager.loadSavefileImages = function (info) {
    if (info.characters) {
        for (var i = 0; i < info.characters.length; i++) {
            ImageManager.reserveCharacter(info.characters[i][0]);
        }
    }
    if (info.faces) {
        for (var j = 0; j < info.faces.length; j++) {
            ImageManager.reserveFace(info.faces[j][0]);
        }
    }
};

DataManager.maxSavefiles = function () {
    return 20;
};

DataManager.saveGame = function (savefileId) {
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
};

DataManager.loadGame = function (savefileId) {
    try {
        return this.loadGameWithoutRescue(savefileId);
    } catch (e) {
        console.error(e);
        return false;
    }
};

DataManager.loadSavefileInfo = function (savefileId) {
    var globalInfo = this.loadGlobalInfo();
    return globalInfo && globalInfo[savefileId] ? globalInfo[savefileId] : null;
};

DataManager.lastAccessedSavefileId = function () {
    return this._lastAccessedId;
};

DataManager.saveGameWithoutRescue = function (savefileId) {
    var json = JsonEx.stringify(this.makeSaveContents());
    if (json.length >= 200000) {
        console.warn('Save data too big!');
    }
    StorageManager.save(savefileId, json);
    this._lastAccessedId = savefileId;
    var globalInfo = this.loadGlobalInfo() || [];
    globalInfo[savefileId] = this.makeSavefileInfo();
    this.saveGlobalInfo(globalInfo);
    return true;
};

DataManager.loadGameWithoutRescue = function (savefileId) {
    if (this.isThisGameFile(savefileId)) {
        var json = StorageManager.load(savefileId);
        this.createGameObjects();
        this.extractSaveContents(JsonEx.parse(json));
        this._lastAccessedId = savefileId;
        return true;
    } else {
        return false;
    }
};

DataManager.selectSavefileForNewGame = function () {
    var globalInfo = this.loadGlobalInfo();
    this._lastAccessedId = 1;
    if (globalInfo) {
        var numSavefiles = Math.max(0, globalInfo.length - 1);
        if (numSavefiles < this.maxSavefiles()) {
            this._lastAccessedId = numSavefiles + 1;
        } else {
            var timestamp = Number.MAX_VALUE;
            for (var i = 1; i < globalInfo.length; i++) {
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
};

DataManager.makeSavefileInfo = function () {
    var info = {};
    info.globalId = this._globalId;
    info.title = global.$dataSystem.gameTitle;
    info.characters = global.$gameParty.charactersForSavefile();
    info.faces = global.$gameParty.facesForSavefile();
    info.playtime = global.$gameSystem.playtimeText();
    info.timestamp = Date.now();
    return info;
};

DataManager.makeSaveContents = function () {
    // A save data does not contain global.$gameTemp, global.$gameMessage, and global.$gameTroop.
    var contents = {};
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
};

DataManager.extractSaveContents = function (contents) {
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
};

DataManager.setAutoSaveFileId = function (autoSaveFileId) {
    this._autoSaveFileId = autoSaveFileId;
};

DataManager.isAutoSaveFileId = function (saveFileId) {
    return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
};

DataManager.autoSaveGame = function () {
    if (this._autoSaveFileId !== 0 && !this.isEventTest() && global.$gameSystem.isSaveEnabled()) {
        global.$gameSystem.onBeforeSave();
        if (this.saveGame(this._autoSaveFileId)) {
            StorageManager.cleanBackup(this._autoSaveFileId);
        }
    }
};
