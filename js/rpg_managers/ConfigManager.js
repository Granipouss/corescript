import { AudioManager } from '../rpg_managers/AudioManager';
import { StorageManager } from './StorageManager';

/**
 * The static class that manages the configuration data.
 */
export const ConfigManager = new (class ConfigManager {
    alwaysDash = false;
    commandRemember = false;

    get bgmVolume() {
        return AudioManager._bgmVolume;
    }
    set bgmVolume(value) {
        AudioManager.bgmVolume = value;
    }

    get bgsVolume() {
        return AudioManager.bgsVolume;
    }
    set bgsVolume(value) {
        AudioManager.bgsVolume = value;
    }

    get meVolume() {
        return AudioManager.meVolume;
    }
    set meVolume(value) {
        AudioManager.meVolume = value;
    }

    get seVolume() {
        return AudioManager.seVolume;
    }
    set seVolume(value) {
        AudioManager.seVolume = value;
    }

    load() {
        var json;
        var config = {};
        try {
            json = StorageManager.load(-1);
        } catch (e) {
            console.error(e);
        }
        if (json) {
            config = JSON.parse(json);
        }
        this.applyData(config);
    }

    save() {
        StorageManager.save(-1, JSON.stringify(this.makeData()));
    }

    makeData() {
        var config = {};
        config.alwaysDash = this.alwaysDash;
        config.commandRemember = this.commandRemember;
        config.bgmVolume = this.bgmVolume;
        config.bgsVolume = this.bgsVolume;
        config.meVolume = this.meVolume;
        config.seVolume = this.seVolume;
        return config;
    }

    applyData(config) {
        this.alwaysDash = this.readFlag(config, 'alwaysDash');
        this.commandRemember = this.readFlag(config, 'commandRemember');
        this.bgmVolume = this.readVolume(config, 'bgmVolume');
        this.bgsVolume = this.readVolume(config, 'bgsVolume');
        this.meVolume = this.readVolume(config, 'meVolume');
        this.seVolume = this.readVolume(config, 'seVolume');
    }

    readFlag(config, name) {
        return !!config[name];
    }

    readVolume(config, name) {
        var value = config[name];
        if (value !== undefined) {
            return Number(value).clamp(0, 100);
        } else {
            return 100;
        }
    }
})();
