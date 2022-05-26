import { Decrypter } from '../rpg_core/Decrypter';
import { Graphics } from '../rpg_core/Graphics';
import { Html5Audio } from '../rpg_core/Html5Audio';
import { Utils } from '../rpg_core/Utils';
import { WebAudio } from '../rpg_core/WebAudio';
import type { AudioFile } from '../rpg_data/audio-file';

/**
 * The static class that handles BGM, BGS, ME and SE.
 */
export const AudioManager = new (class AudioManager {
    private _masterVolume = 1; // (min: 0, max: 1)
    private _bgmVolume = 100;
    private _bgsVolume = 100;
    private _meVolume = 100;
    private _seVolume = 100;

    private _currentBgm: AudioFile = null;
    private _currentBgs: AudioFile = null;
    private _bgmBuffer: WebAudio = null;
    private _bgsBuffer: WebAudio = null;
    private _meBuffer: WebAudio = null;
    private _seBuffers: WebAudio[] = [];
    private _staticBuffers: WebAudio[] = [];

    private _replayFadeTime = 0.5;
    private _path = 'audio/';
    private _blobUrl: string = null;
    private _currentMe: AudioFile;
    private _creationHook?: (audio: WebAudio) => void;

    get masterVolume(): number {
        return this._masterVolume;
    }
    set masterVolume(value: number) {
        this._masterVolume = value;
        WebAudio.setMasterVolume(this._masterVolume);
        Graphics.setVideoVolume(this._masterVolume);
    }

    get bgmVolume(): number {
        return this._bgmVolume;
    }
    set bgmVolume(value: number) {
        this._bgmVolume = value;
        this.updateBgmParameters(this._currentBgm);
    }

    get bgsVolume(): number {
        return this._bgsVolume;
    }
    set bgsVolume(value: number) {
        this._bgsVolume = value;
        this.updateBgsParameters(this._currentBgs);
    }

    get meVolume(): number {
        return this._meVolume;
    }
    set meVolume(value: number) {
        this._meVolume = value;
        this.updateMeParameters(this._currentMe);
    }

    get seVolume(): number {
        return this._seVolume;
    }
    set seVolume(value: number) {
        this._seVolume = value;
    }

    playBgm(bgm: AudioFile, pos = 0): void {
        if (this.isCurrentBgm(bgm)) {
            this.updateBgmParameters(bgm);
        } else {
            this.stopBgm();
            if (bgm.name) {
                if (Decrypter.hasEncryptedAudio && this.shouldUseHtml5Audio()) {
                    this.playEncryptedBgm(bgm, pos);
                } else {
                    this._bgmBuffer = this.createBuffer('bgm', bgm.name);
                    this.updateBgmParameters(bgm);
                    if (!this._meBuffer) {
                        this._bgmBuffer.play(true, pos || 0);
                    }
                }
            }
        }
        this.updateCurrentBgm(bgm, pos);
    }

    playEncryptedBgm(bgm: AudioFile, pos = 0): void {
        const ext = this.audioFileExt();
        let url = this._path + 'bgm/' + encodeURIComponent(bgm.name) + ext;
        url = Decrypter.extToEncryptExt(url);
        Decrypter.decryptHTML5Audio(url, bgm, pos);
    }

    createDecryptBuffer(url: string, bgm: AudioFile, pos = 0): void {
        this._blobUrl = url;
        this._bgmBuffer = this.createBuffer('bgm', bgm.name);
        this.updateBgmParameters(bgm);
        if (!this._meBuffer) {
            this._bgmBuffer.play(true, pos || 0);
        }
        this.updateCurrentBgm(bgm, pos);
    }

    replayBgm(bgm: AudioFile): void {
        if (this.isCurrentBgm(bgm)) {
            this.updateBgmParameters(bgm);
        } else {
            this.playBgm(bgm, bgm.pos);
            if (this._bgmBuffer) {
                this._bgmBuffer.fadeIn(this._replayFadeTime);
            }
        }
    }

    isCurrentBgm(bgm: AudioFile): boolean {
        return this._currentBgm && this._bgmBuffer && this._currentBgm.name === bgm.name;
    }

    updateBgmParameters(bgm: AudioFile): void {
        this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
    }

    updateCurrentBgm(bgm: AudioFile, pos = 0): void {
        this._currentBgm = {
            name: bgm.name,
            volume: bgm.volume,
            pitch: bgm.pitch,
            pan: bgm.pan,
            pos: pos,
        };
    }

    stopBgm(): void {
        if (this._bgmBuffer) {
            this._bgmBuffer.stop();
            this._bgmBuffer = null;
            this._currentBgm = null;
        }
    }

    fadeOutBgm(duration: number): void {
        if (this._bgmBuffer && this._currentBgm) {
            this._bgmBuffer.fadeOut(duration);
            this._currentBgm = null;
        }
    }

    fadeInBgm(duration: number): void {
        if (this._bgmBuffer && this._currentBgm) {
            this._bgmBuffer.fadeIn(duration);
        }
    }

    playBgs(bgs: AudioFile, pos = 0): void {
        if (this.isCurrentBgs(bgs)) {
            this.updateBgsParameters(bgs);
        } else {
            this.stopBgs();
            if (bgs.name) {
                this._bgsBuffer = this.createBuffer('bgs', bgs.name);
                this.updateBgsParameters(bgs);
                this._bgsBuffer.play(true, pos || 0);
            }
        }
        this.updateCurrentBgs(bgs, pos);
    }

    replayBgs(bgs: AudioFile): void {
        if (this.isCurrentBgs(bgs)) {
            this.updateBgsParameters(bgs);
        } else {
            this.playBgs(bgs, bgs.pos);
            if (this._bgsBuffer) {
                this._bgsBuffer.fadeIn(this._replayFadeTime);
            }
        }
    }

    isCurrentBgs(bgs: AudioFile): boolean {
        return this._currentBgs && this._bgsBuffer && this._currentBgs.name === bgs.name;
    }

    updateBgsParameters(bgs: AudioFile): void {
        this.updateBufferParameters(this._bgsBuffer, this._bgsVolume, bgs);
    }

    updateCurrentBgs(bgs: AudioFile, pos: number): void {
        this._currentBgs = {
            name: bgs.name,
            volume: bgs.volume,
            pitch: bgs.pitch,
            pan: bgs.pan,
            pos: pos,
        };
    }

    stopBgs(): void {
        if (this._bgsBuffer) {
            this._bgsBuffer.stop();
            this._bgsBuffer = null;
            this._currentBgs = null;
        }
    }

    fadeOutBgs(duration: number): void {
        if (this._bgsBuffer && this._currentBgs) {
            this._bgsBuffer.fadeOut(duration);
            this._currentBgs = null;
        }
    }

    fadeInBgs(duration: number): void {
        if (this._bgsBuffer && this._currentBgs) {
            this._bgsBuffer.fadeIn(duration);
        }
    }

    playMe(me: AudioFile): void {
        this.stopMe();
        if (me.name) {
            if (this._bgmBuffer && this._currentBgm) {
                this._currentBgm.pos = this._bgmBuffer.seek();
                this._bgmBuffer.stop();
            }
            this._meBuffer = this.createBuffer('me', me.name);
            this.updateMeParameters(me);
            this._meBuffer.play(false);
            this._meBuffer.addStopListener(this.stopMe.bind(this));
        }
    }

    updateMeParameters(me: AudioFile): void {
        this.updateBufferParameters(this._meBuffer, this._meVolume, me);
    }

    fadeOutMe(duration: number): void {
        if (this._meBuffer) {
            this._meBuffer.fadeOut(duration);
        }
    }

    stopMe(): void {
        if (this._meBuffer) {
            this._meBuffer.stop();
            this._meBuffer = null;
            if (this._bgmBuffer && this._currentBgm && !this._bgmBuffer.isPlaying()) {
                this._bgmBuffer.play(true, this._currentBgm.pos);
                this._bgmBuffer.fadeIn(this._replayFadeTime);
            }
        }
    }

    playSe(se: AudioFile): void {
        if (se.name) {
            this._seBuffers = this._seBuffers.filter((audio) => audio.isPlaying());
            const buffer = this.createBuffer('se', se.name);
            this.updateSeParameters(buffer, se);
            buffer.play(false);
            this._seBuffers.push(buffer);
        }
    }

    updateSeParameters(buffer: WebAudio, se: AudioFile): void {
        this.updateBufferParameters(buffer, this._seVolume, se);
    }

    stopSe(): void {
        this._seBuffers.forEach((buffer) => {
            buffer.stop();
        });
        this._seBuffers = [];
    }

    playStaticSe(se: AudioFile): void {
        if (se.name) {
            this.loadStaticSe(se);
            for (let i = 0; i < this._staticBuffers.length; i++) {
                const buffer = this._staticBuffers[i];
                if (buffer._reservedSeName === se.name) {
                    buffer.stop();
                    this.updateSeParameters(buffer, se);
                    buffer.play(false);
                    break;
                }
            }
        }
    }

    loadStaticSe(se: AudioFile): void {
        if (se.name && !this.isStaticSe(se)) {
            const buffer = this.createBuffer('se', se.name);
            buffer._reservedSeName = se.name;
            this._staticBuffers.push(buffer);
            if (this.shouldUseHtml5Audio()) {
                Html5Audio.setStaticSe(buffer.url);
            }
        }
    }

    isStaticSe(se: AudioFile): boolean {
        for (let i = 0; i < this._staticBuffers.length; i++) {
            const buffer = this._staticBuffers[i];
            if (buffer._reservedSeName === se.name) {
                return true;
            }
        }
        return false;
    }

    stopAll(): void {
        this.stopMe();
        this.stopBgm();
        this.stopBgs();
        this.stopSe();
    }

    saveBgm(): AudioFile {
        if (this._currentBgm) {
            const bgm = this._currentBgm;
            return {
                name: bgm.name,
                volume: bgm.volume,
                pitch: bgm.pitch,
                pan: bgm.pan,
                pos: this._bgmBuffer ? this._bgmBuffer.seek() : 0,
            };
        } else {
            return this.makeEmptyAudioObject();
        }
    }

    saveBgs(): AudioFile {
        if (this._currentBgs) {
            const bgs = this._currentBgs;
            return {
                name: bgs.name,
                volume: bgs.volume,
                pitch: bgs.pitch,
                pan: bgs.pan,
                pos: this._bgsBuffer ? this._bgsBuffer.seek() : 0,
            };
        } else {
            return this.makeEmptyAudioObject();
        }
    }

    makeEmptyAudioObject(): AudioFile {
        return { name: '', volume: 0, pitch: 0 };
    }

    createBuffer(folder: string, name: string): WebAudio {
        const ext = this.audioFileExt();
        const url = this._path + folder + '/' + encodeURIComponent(name) + ext;
        if (this.shouldUseHtml5Audio() && folder === 'bgm') {
            if (this._blobUrl) Html5Audio.setup(this._blobUrl);
            else Html5Audio.setup(url);
            return Html5Audio as unknown as WebAudio;
        } else {
            const audio = new WebAudio(url);
            this._callCreationHook(audio);
            return audio;
        }
    }

    updateBufferParameters(buffer: WebAudio, configVolume: number, audio: AudioFile): void {
        if (buffer && audio) {
            buffer.volume = (configVolume * (audio.volume || 0)) / 10000;
            buffer.pitch = (audio.pitch || 0) / 100;
            buffer.pan = (audio.pan || 0) / 100;
        }
    }

    audioFileExt(): '.ogg' | '.m4a' {
        if (WebAudio.canPlayOgg() && !Utils.isMobileDevice()) {
            return '.ogg';
        } else {
            return '.m4a';
        }
    }

    shouldUseHtml5Audio(): boolean {
        // The only case where we wanted html5audio was android/ no encrypt
        // Atsuma-ru asked to force webaudio there too, so just return false for ALL
        // return Utils.isAndroidChrome() && !Decrypter.hasEncryptedAudio;
        return false;
    }

    checkErrors(): void {
        this.checkWebAudioError(this._bgmBuffer);
        this.checkWebAudioError(this._bgsBuffer);
        this.checkWebAudioError(this._meBuffer);
        this._seBuffers.forEach((buffer) => {
            this.checkWebAudioError(buffer);
        });
        this._staticBuffers.forEach((buffer) => {
            this.checkWebAudioError(buffer);
        });
    }

    checkWebAudioError(webAudio: WebAudio): void {
        if (webAudio && webAudio.isError()) {
            throw new Error('Failed to load: ' + webAudio.url);
        }
    }

    setCreationHook(hook: (audio: WebAudio) => void) {
        this._creationHook = hook;
    }

    _callCreationHook(audio: WebAudio): void {
        if (this._creationHook) this._creationHook(audio);
    }
})();
