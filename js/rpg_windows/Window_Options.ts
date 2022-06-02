import { clamp } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';

import { Config, ConfigManager } from '../rpg_managers/ConfigManager';
import { SoundManager } from '../rpg_managers/SoundManager';
import { TextManager } from '../rpg_managers/TextManager';

import { Window_Command } from './Window_Command';

/**
 * The window for changing various settings on the options screen.
 */
export class Window_Options extends Window_Command {
    initialize(): void {
        super.initialize(0, 0);
        this.updatePlacement();
    }

    windowWidth(): number {
        return 400;
    }

    windowHeight(): number {
        return this.fittingHeight(Math.min(this.numVisibleRows(), 12));
    }

    updatePlacement(): void {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
    }

    makeCommandList(): void {
        this.addGeneralOptions();
        this.addVolumeOptions();
    }

    addGeneralOptions(): void {
        this.addCommand(TextManager.alwaysDash, 'alwaysDash');
        this.addCommand(TextManager.commandRemember, 'commandRemember');
    }

    addVolumeOptions(): void {
        this.addCommand(TextManager.bgmVolume, 'bgmVolume');
        this.addCommand(TextManager.bgsVolume, 'bgsVolume');
        this.addCommand(TextManager.meVolume, 'meVolume');
        this.addCommand(TextManager.seVolume, 'seVolume');
    }

    drawItem(index: number): void {
        const rect = this.itemRectForText(index);
        const statusWidth = this.statusWidth();
        const titleWidth = rect.width - statusWidth;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, 'left');
        this.drawText(this.statusText(index), rect.x + titleWidth, rect.y, statusWidth, 'right');
    }

    statusWidth(): number {
        return 120;
    }

    commandSymbol(index: number): keyof Config {
        return super.commandSymbol(index) as keyof Config;
    }

    statusText(index: number): string {
        const symbol = this.commandSymbol(index);
        if (this.isVolumeSymbol(symbol)) {
            const value = this.getConfigValue(symbol) as number;
            return this.volumeStatusText(value);
        } else {
            const value = this.getConfigValue(symbol) as boolean;
            return this.booleanStatusText(value);
        }
    }

    isVolumeSymbol(symbol: string): boolean {
        return symbol.includes('Volume');
    }

    booleanStatusText(value: boolean): string {
        return value ? 'ON' : 'OFF';
    }

    volumeStatusText(value: number): string {
        return value + '%';
    }

    processOk(): void {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (this.isVolumeSymbol(symbol)) {
            let value = this.getConfigValue(symbol) as number;
            value += this.volumeOffset();
            if (value > 100) {
                value = 0;
            }
            value = clamp(value, [0, 100]);
            this.changeValue(symbol, value);
        } else {
            const value = this.getConfigValue(symbol) as boolean;
            this.changeValue(symbol, !value);
        }
    }

    cursorRight(_wrap?: boolean): void {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (this.isVolumeSymbol(symbol)) {
            let value = this.getConfigValue(symbol) as number;
            value += this.volumeOffset();
            value = clamp(value, [0, 100]);
            this.changeValue(symbol, value);
        } else {
            this.changeValue(symbol, true);
        }
    }

    cursorLeft(_wrap?: boolean): void {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (this.isVolumeSymbol(symbol)) {
            let value = this.getConfigValue(symbol) as number;
            value -= this.volumeOffset();
            value = clamp(value, [0, 100]);
            this.changeValue(symbol, value);
        } else {
            this.changeValue(symbol, false);
        }
    }

    volumeOffset(): number {
        return 20;
    }

    changeValue<T extends keyof Config>(symbol: T, value: typeof ConfigManager[T]): void {
        const lastValue = this.getConfigValue(symbol);
        if (lastValue !== value) {
            this.setConfigValue(symbol, value);
            this.redrawItem(this.findSymbol(symbol));
            SoundManager.playCursor();
        }
    }

    getConfigValue<T extends keyof Config>(symbol: T): typeof ConfigManager[T] {
        return ConfigManager[symbol];
    }

    setConfigValue<T extends keyof Config>(symbol: T, volume: typeof ConfigManager[T]): void {
        ConfigManager[symbol] = volume;
    }
}
