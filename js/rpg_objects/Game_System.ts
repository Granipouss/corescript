import { Tone } from '../rpg_core/extension';
import { Graphics } from '../rpg_core/Graphics';
import type { AudioFile } from '../rpg_data/audio-file';
import { AudioManager } from '../rpg_managers/AudioManager';
import { SceneManager } from '../rpg_managers/SceneManager';

/**
 * The game object class for the system data.
 */
export class Game_System {
    private _saveEnabled: boolean;
    private _menuEnabled: boolean;
    private _encounterEnabled: boolean;
    private _formationEnabled: boolean;
    private _battleCount: number;
    private _winCount: number;
    private _escapeCount: number;
    private _saveCount: number;
    private _versionId: number;
    private _framesOnSave: number;
    private _sceneFramesOnSave: number;
    private _windowTone: Tone;
    private _bgmOnSave: AudioFile;
    private _bgsOnSave: AudioFile;
    private _battleBgm: AudioFile;
    private _victoryMe: AudioFile;
    private _defeatMe: AudioFile;
    private _savedBgm: AudioFile;
    private _walkingBgm: AudioFile;

    constructor() {
        this._saveEnabled = true;
        this._menuEnabled = true;
        this._encounterEnabled = true;
        this._formationEnabled = true;
        this._battleCount = 0;
        this._winCount = 0;
        this._escapeCount = 0;
        this._saveCount = 0;
        this._versionId = 0;
        this._framesOnSave = 0;
        this._sceneFramesOnSave = 0;
        this._bgmOnSave = null;
        this._bgsOnSave = null;
        this._windowTone = null;
        this._battleBgm = null;
        this._victoryMe = null;
        this._defeatMe = null;
        this._savedBgm = null;
        this._walkingBgm = null;
    }

    isJapanese(): boolean {
        return !!window.$dataSystem.locale.match(/^ja/);
    }

    isChinese(): boolean {
        return !!window.$dataSystem.locale.match(/^zh/);
    }

    isKorean(): boolean {
        return !!window.$dataSystem.locale.match(/^ko/);
    }

    isCJK(): boolean {
        return !!window.$dataSystem.locale.match(/^(ja|zh|ko)/);
    }

    isRussian(): boolean {
        return !!window.$dataSystem.locale.match(/^ru/);
    }

    isSideView(): boolean {
        return window.$dataSystem.optSideView;
    }

    isSaveEnabled(): boolean {
        return this._saveEnabled;
    }

    disableSave(): void {
        this._saveEnabled = false;
    }

    enableSave(): void {
        this._saveEnabled = true;
    }

    isMenuEnabled(): boolean {
        return this._menuEnabled;
    }

    disableMenu(): void {
        this._menuEnabled = false;
    }

    enableMenu(): void {
        this._menuEnabled = true;
    }

    isEncounterEnabled(): boolean {
        return this._encounterEnabled;
    }

    disableEncounter(): void {
        this._encounterEnabled = false;
    }

    enableEncounter(): void {
        this._encounterEnabled = true;
    }

    isFormationEnabled(): boolean {
        return this._formationEnabled;
    }

    disableFormation(): void {
        this._formationEnabled = false;
    }

    enableFormation(): void {
        this._formationEnabled = true;
    }

    battleCount(): number {
        return this._battleCount;
    }

    winCount(): number {
        return this._winCount;
    }

    escapeCount(): number {
        return this._escapeCount;
    }

    saveCount(): number {
        return this._saveCount;
    }

    versionId(): number {
        return this._versionId;
    }

    windowTone(): Tone {
        return this._windowTone || window.$dataSystem.windowTone;
    }

    setWindowTone(value: Tone): void {
        this._windowTone = value;
    }

    battleBgm(): AudioFile {
        return this._battleBgm || window.$dataSystem.battleBgm;
    }

    setBattleBgm(value: AudioFile): void {
        this._battleBgm = value;
    }

    victoryMe(): AudioFile {
        return this._victoryMe || window.$dataSystem.victoryMe;
    }

    setVictoryMe(value: AudioFile): void {
        this._victoryMe = value;
    }

    defeatMe(): AudioFile {
        return this._defeatMe || window.$dataSystem.defeatMe;
    }

    setDefeatMe(value: AudioFile): void {
        this._defeatMe = value;
    }

    onBattleStart(): void {
        this._battleCount++;
    }

    onBattleWin(): void {
        this._winCount++;
    }

    onBattleEscape(): void {
        this._escapeCount++;
    }

    onBeforeSave(): void {
        this._saveCount++;
        this._versionId = window.$dataSystem.versionId;
        this._framesOnSave = Graphics.frameCount;
        this._sceneFramesOnSave = SceneManager.frameCount();
        this._bgmOnSave = AudioManager.saveBgm();
        this._bgsOnSave = AudioManager.saveBgs();
    }

    onAfterLoad(): void {
        Graphics.frameCount = this._framesOnSave;
        SceneManager.setFrameCount(this._sceneFramesOnSave || this._framesOnSave);
        AudioManager.playBgm(this._bgmOnSave);
        AudioManager.playBgs(this._bgsOnSave);
    }

    playtime(): number {
        return Math.floor(SceneManager.frameCount() / 60);
    }

    playtimeText(): string {
        const hour = Math.floor(this.playtime() / 60 / 60);
        const min = Math.floor(this.playtime() / 60) % 60;
        const sec = this.playtime() % 60;
        return String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    saveBgm(): void {
        this._savedBgm = AudioManager.saveBgm();
    }

    replayBgm(): void {
        if (this._savedBgm) {
            AudioManager.replayBgm(this._savedBgm);
        }
    }

    saveWalkingBgm(): void {
        this._walkingBgm = AudioManager.saveBgm();
    }

    replayWalkingBgm(): void {
        if (this._walkingBgm) {
            AudioManager.playBgm(this._walkingBgm);
        }
    }

    saveWalkingBgm2(): void {
        this._walkingBgm = window.$dataMap.bgm;
    }
}
