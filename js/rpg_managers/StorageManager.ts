/* eslint-disable @typescript-eslint/no-var-requires */

import * as LZString from 'lz-string';

import { format } from '../rpg_core/extension';
import { Utils } from '../rpg_core/Utils';

/**
 * The static class that manages storage for saving game data.
 */
export const StorageManager = new (class StorageManager {
    private _canMakeWwwSaveDirectory: boolean;

    save(savefileId: number, json: string): void {
        if (this.isLocalMode()) {
            this.saveToLocalFile(savefileId, json);
        } else {
            this.saveToWebStorage(savefileId, json);
        }
    }

    load(savefileId: number): string {
        if (this.isLocalMode()) {
            return this.loadFromLocalFile(savefileId);
        } else {
            return this.loadFromWebStorage(savefileId);
        }
    }

    exists(savefileId: number): boolean {
        if (this.isLocalMode()) {
            return this.localFileExists(savefileId);
        } else {
            return this.webStorageExists(savefileId);
        }
    }

    remove(savefileId: number): void {
        if (this.isLocalMode()) {
            this.removeLocalFile(savefileId);
        } else {
            this.removeWebStorage(savefileId);
        }
    }

    backup(savefileId: number): void {
        if (this.exists(savefileId)) {
            if (this.isLocalMode()) {
                const data = this.loadFromLocalFile(savefileId);
                const compressed = LZString.compressToBase64(data);
                const fs = require('fs');
                const dirPath = this.localFileDirectoryPath();
                const filePath = this.localFilePath(savefileId) + '.bak';
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
            } else {
                const data = this.loadFromWebStorage(savefileId);
                const compressed = LZString.compressToBase64(data);
                const key = this.webStorageKey(savefileId) + 'bak';
                localStorage.setItem(key, compressed);
            }
        }
    }

    backupExists(savefileId: number): boolean {
        if (this.isLocalMode()) {
            return this.localFileBackupExists(savefileId);
        } else {
            return this.webStorageBackupExists(savefileId);
        }
    }

    cleanBackup(savefileId: number): void {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                const fs = require('fs');
                // const dirPath = this.localFileDirectoryPath();
                const filePath = this.localFilePath(savefileId);
                fs.unlinkSync(filePath + '.bak');
            } else {
                const key = this.webStorageKey(savefileId);
                localStorage.removeItem(key + 'bak');
            }
        }
    }

    restoreBackup(savefileId: number): void {
        if (this.backupExists(savefileId)) {
            if (this.isLocalMode()) {
                const data = this.loadFromLocalBackupFile(savefileId);
                const compressed = LZString.compressToBase64(data);
                const fs = require('fs');
                const dirPath = this.localFileDirectoryPath();
                const filePath = this.localFilePath(savefileId);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath);
                }
                fs.writeFileSync(filePath, compressed);
                fs.unlinkSync(filePath + '.bak');
            } else {
                const data = this.loadFromWebStorageBackup(savefileId);
                const compressed = LZString.compressToBase64(data);
                const key = this.webStorageKey(savefileId);
                localStorage.setItem(key, compressed);
                localStorage.removeItem(key + 'bak');
            }
        }
    }

    isLocalMode(): boolean {
        return Utils.isNwjs();
    }

    saveToLocalFile(savefileId: number, json: string): void {
        const data = LZString.compressToBase64(json);
        const fs = require('fs');
        const dirPath = this.localFileDirectoryPath();
        const filePath = this.localFilePath(savefileId);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        fs.writeFileSync(filePath, data);
    }

    loadFromLocalFile(savefileId: number): string {
        let data = null;
        const fs = require('fs');
        const filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        return LZString.decompressFromBase64(data);
    }

    loadFromLocalBackupFile(savefileId: number): string {
        let data = null;
        const fs = require('fs');
        const filePath = this.localFilePath(savefileId) + '.bak';
        if (fs.existsSync(filePath)) {
            data = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        return LZString.decompressFromBase64(data);
    }

    localFileBackupExists(savefileId: number): boolean {
        const fs = require('fs');
        return fs.existsSync(this.localFilePath(savefileId) + '.bak');
    }

    localFileExists(savefileId: number): boolean {
        const fs = require('fs');
        return fs.existsSync(this.localFilePath(savefileId));
    }

    removeLocalFile(savefileId: number): void {
        const fs = require('fs');
        const filePath = this.localFilePath(savefileId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    saveToWebStorage(savefileId: number, json: string): void {
        const key = this.webStorageKey(savefileId);
        const data = LZString.compressToBase64(json);
        localStorage.setItem(key, data);
    }

    loadFromWebStorage(savefileId: number): string {
        const key = this.webStorageKey(savefileId);
        const data = localStorage.getItem(key);
        return LZString.decompressFromBase64(data);
    }

    loadFromWebStorageBackup(savefileId: number): string {
        const key = this.webStorageKey(savefileId) + 'bak';
        const data = localStorage.getItem(key);
        return LZString.decompressFromBase64(data);
    }

    webStorageBackupExists(savefileId: number): boolean {
        const key = this.webStorageKey(savefileId) + 'bak';
        return !!localStorage.getItem(key);
    }

    webStorageExists(savefileId: number): boolean {
        const key = this.webStorageKey(savefileId);
        return !!localStorage.getItem(key);
    }

    removeWebStorage(savefileId: number): void {
        const key = this.webStorageKey(savefileId);
        localStorage.removeItem(key);
    }

    localFileDirectoryPath(): string {
        const path = require('path');

        const base = path.dirname(process.mainModule.filename);
        if (this.canMakeWwwSaveDirectory()) {
            return path.join(base, 'save/');
        } else {
            return path.join(path.dirname(base), 'save/');
        }
    }

    localFilePath(savefileId: number): string {
        let name: string;
        if (savefileId < 0) {
            name = 'config.rpgsave';
        } else if (savefileId === 0) {
            name = 'global.rpgsave';
        } else {
            name = format('file%1.rpgsave', savefileId);
        }
        return this.localFileDirectoryPath() + name;
    }

    webStorageKey(savefileId: number): string {
        if (savefileId < 0) {
            return 'RPG Config';
        } else if (savefileId === 0) {
            return 'RPG Global';
        } else {
            return format('RPG File%1', savefileId);
        }
    }

    // Enigma Virtual Box cannot make www/save directory
    canMakeWwwSaveDirectory(): boolean {
        if (this._canMakeWwwSaveDirectory === undefined) {
            const fs = require('fs');
            const path = require('path');
            const base = path.dirname(process.mainModule.filename);
            const testPath = path.join(base, 'testDirectory/');
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
