import { clamp } from '../rpg_core/extension';
import { AudioManager } from './AudioManager';
import { StorageManager } from './StorageManager';

export type Config = {
    alwaysDash: boolean;
    commandRemember: boolean;
    bgmVolume: number;
    bgsVolume: number;
    meVolume: number;
    seVolume: number;
};

/**
 * The static class that manages the configuration data.
 */
export const ConfigManager = new (class ConfigManager {
    alwaysDash = false;
    commandRemember = false;

    get bgmVolume(): number {
        return AudioManager.bgmVolume;
    }
    set bgmVolume(value: number) {
        AudioManager.bgmVolume = value;
    }

    get bgsVolume(): number {
        return AudioManager.bgsVolume;
    }
    set bgsVolume(value: number) {
        AudioManager.bgsVolume = value;
    }

    get meVolume(): number {
        return AudioManager.meVolume;
    }
    set meVolume(value: number) {
        AudioManager.meVolume = value;
    }

    get seVolume(): number {
        return AudioManager.seVolume;
    }
    set seVolume(value: number) {
        AudioManager.seVolume = value;
    }

    load(): void {
        let json: string;
        let config = {};
        try {
            json = StorageManager.load(-1);
        } catch (e) {
            console.error(e);
        }
        if (json) {
            config = JSON.parse(json);
        }
        this.applyData(config as Config);
    }

    save(): void {
        StorageManager.save(-1, JSON.stringify(this.makeData()));
    }

    makeData(): Config {
        return {
            alwaysDash: this.alwaysDash,
            commandRemember: this.commandRemember,
            bgmVolume: this.bgmVolume,
            bgsVolume: this.bgsVolume,
            meVolume: this.meVolume,
            seVolume: this.seVolume,
        };
    }

    applyData(config: Config): void {
        this.alwaysDash = this.readFlag(config, 'alwaysDash');
        this.commandRemember = this.readFlag(config, 'commandRemember');
        this.bgmVolume = this.readVolume(config, 'bgmVolume');
        this.bgsVolume = this.readVolume(config, 'bgsVolume');
        this.meVolume = this.readVolume(config, 'meVolume');
        this.seVolume = this.readVolume(config, 'seVolume');
    }

    readFlag(config: Config, name: keyof Config): boolean {
        return !!config[name];
    }

    readVolume(config: Config, name: keyof Config): number {
        const value = config[name] as number;
        if (value !== undefined) {
            return clamp(value, [0, 100]);
        } else {
            return 100;
        }
    }
})();
