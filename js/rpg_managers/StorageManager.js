/* global LZString, process */

import { Utils } from '../rpg_core/Utils';

// FIXME:
const require = () => void 0;

/**
 * The static class that manages storage for saving game data.
 */
export const StorageManager = new (class StorageManager {
    save(savefileId, json) {
        if (this.isLocalMode()) {
            this.saveToLocalFile(savefileId, json);
        } else {
            this.saveToWebStorage(savefileId, json);
        }
    }

    load(savefileId) {
        if (this.isLocalMode()) {
            return this.loadFromLocalFile(savefileId);
        } else {
            return this.loadFromWebStorage(savefileId);
        }
    }

    exists(savefileId) {
        if (this.isLocalMode()) {
            return this.localFileExists(savefileId);
        } else {
            return this.webStorageExists(savefileId);
        }
    }

    remove(savefileId) {
        if (this.isLocalMode()) {
            this.removeLocalFile(savefileId);
        } else {
            this.removeWebStorage(savefileId);
        }
    }

    backup(savefileId) {
        if (this.exists(savefileId)) {
            if (this.isLocalMode()) {
                var data = this.loadFromLocalFile(savefileId);
                var compressed = LZString.compressToBase64(data);
                var fs = require('fs');
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId) + '.bak';
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
            } else {
                // var data = this.loadFromWebStorage(savefileId);
                // var compressed = LZString.compressToBase64(data);
                var key = this.webStorageKey(savefileId) + 'bak';
                localStorage.setItem(key, compressed);
            }
        }
    }

    backupExists(savefileId) {
        if (this.isLocalMode()) {
            return this.localFileBackupExists(savefileId);
        } else {
            return this.webStorageBackupExists(savefileId);
        }
    }

    cleanBackup(savefileId) {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                var fs = require('fs');
                // var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId);
                fs.unlinkSync(filePath + '.bak');
            } else {
                var key = this.webStorageKey(savefileId);
                localStorage.removeItem(key + 'bak');
            }
        }
    }

    restoreBackup(savefileId) {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                var data = this.loadFromLocalBackupFile(savefileId);
                var compressed = LZString.compressToBase64(data);
                var fs = require('fs');
                var dirPath = this.localFileDirectoryPath();
                var filePath = this.localFilePath(savefileId);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
                fs.unlinkSync(filePath + '.bak');
            } else {
                // var data = this.loadFromWebStorageBackup(savefileId);
                // var compressed = LZString.compressToBase64(data);
                var key = this.webStorageKey(savefileId);
                localStorage.setItem(key, compressed);
                localStorage.removeItem(key + 'bak');
            }
        }
    }

    isLocalMode() {
        return Utils.isNwjs();
    }

    saveToLocalFile(savefileId, json) {
        var data = LZString.compressToBase64(json);
        var fs = require('fs');
        var dirPath = this.localFileDirectoryPath();
        var filePath = this.localFilePath(savefileId);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        fs.writeFileSync(filePath, data);
    }

    loadFromLocalFile(savefileId) {
        var data = null;
        var fs = require('fs');
        var filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        return LZString.decompressFromBase64(data);
    }

    loadFromLocalBackupFile(savefileId) {
        var data = null;
        var fs = require('fs');
        var filePath = this.localFilePath(savefileId) + '.bak';
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        return LZString.decompressFromBase64(data);
    }

    localFileBackupExists(savefileId) {
        var fs = require('fs');
        return fs.existsSync(this.localFilePath(savefileId) + '.bak');
    }

    localFileExists(savefileId) {
        var fs = require('fs');
        return fs.existsSync(this.localFilePath(savefileId));
    }

    removeLocalFile(savefileId) {
        var fs = require('fs');
        var filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    saveToWebStorage(savefileId, json) {
        var key = this.webStorageKey(savefileId);
        var data = LZString.compressToBase64(json);
        localStorage.setItem(key, data);
    }

    loadFromWebStorage(savefileId) {
        var key = this.webStorageKey(savefileId);
        var data = localStorage.getItem(key);
        return LZString.decompressFromBase64(data);
    }

    loadFromWebStorageBackup(savefileId) {
        var key = this.webStorageKey(savefileId) + 'bak';
        var data = localStorage.getItem(key);
        return LZString.decompressFromBase64(data);
    }

    webStorageBackupExists(savefileId) {
        var key = this.webStorageKey(savefileId) + 'bak';
        return !!localStorage.getItem(key);
    }

    webStorageExists(savefileId) {
        var key = this.webStorageKey(savefileId);
        return !!localStorage.getItem(key);
    }

    removeWebStorage(savefileId) {
        var key = this.webStorageKey(savefileId);
        localStorage.removeItem(key);
    }

    localFileDirectoryPath() {
        var path = require('path');

        var base = path.dirname(process.mainModule.filename);
        if (this.canMakeWwwSaveDirectory()) {
            return path.join(base, 'save/');
        } else {
            return path.join(path.dirname(base), 'save/');
        }
    }

    localFilePath(savefileId) {
        var name;
        if (savefileId < 0) {
            name = 'config.rpgsave';
        } else if (savefileId === 0) {
            name = 'global.rpgsave';
        } else {
            name = 'file%1.rpgsave'.format(savefileId);
        }
        return this.localFileDirectoryPath() + name;
    }

    webStorageKey(savefileId) {
        if (savefileId < 0) {
            return 'RPG Config';
        } else if (savefileId === 0) {
            return 'RPG Global';
        } else {
            return 'RPG File%1'.format(savefileId);
        }
    }

    // Enigma Virtual Box cannot make www/save directory
    canMakeWwwSaveDirectory() {
        if (this._canMakeWwwSaveDirectory === undefined) {
            var fs = require('fs');
            var path = require('path');
            var base = path.dirname(process.mainModule.filename);
            var testPath = path.join(base, 'testDirectory/');
            try {
                fs.mkdirSync(testPath);
                fs.rmdirSync(testPath);
                this._canMakeWwwSaveDirectory = true;
            } catch (e) {
                this._canMakeWwwSaveDirectory = false;
            }
        }
        return this._canMakeWwwSaveDirectory;
    }
})();
