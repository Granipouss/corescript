import type { Bitmap } from '../rpg_core/Bitmap';
import { Graphics } from '../rpg_core/Graphics';
import { Input } from '../rpg_core/Input';
import { TouchInput } from '../rpg_core/TouchInput';
import { Utils } from '../rpg_core/Utils';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { TextState } from './Window_Base';
import { Window_Base } from './Window_Base';
import { Window_ChoiceList } from './Window_ChoiceList';
import { Window_EventItem } from './Window_EventItem';
import { Window_Gold } from './Window_Gold';
import { Window_NumberInput } from './Window_NumberInput';

/**
 * The window for displaying text messages.
 */
export class Window_Message extends Window_Base {
    protected _imageReservationId: number;
    protected _background: number;
    protected _positionType: number;
    protected _waitCount: number;
    protected _faceBitmap: Bitmap;
    protected _textState: TextState;

    protected _goldWindow: Window_Gold;
    protected _choiceWindow: Window_ChoiceList;
    protected _numberWindow: Window_NumberInput;
    protected _itemWindow: Window_EventItem;

    protected _showFast: boolean;
    protected _lineShowFast: boolean;
    protected _pauseSkip: boolean;
    protected _textSpeed: number;
    protected _textSpeedCount: number;

    initialize(): void {
        const width = this.windowWidth();
        const height = this.windowHeight();
        const x = (Graphics.boxWidth - width) / 2;
        super.initialize(x, 0, width, height);
        this.openness = 0;
        this.initMembers();
        this.createSubWindows();
        this.updatePlacement();
    }

    initMembers(): void {
        this._imageReservationId = Utils.generateRuntimeId();
        this._background = 0;
        this._positionType = 2;
        this._waitCount = 0;
        this._faceBitmap = null;
        this._textState = null;
        this.clearFlags();
    }

    subWindows(): Window_Base[] {
        return [this._goldWindow, this._choiceWindow, this._numberWindow, this._itemWindow];
    }

    createSubWindows(): void {
        this._goldWindow = new Window_Gold(0, 0);
        this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
        this._goldWindow.openness = 0;
        this._choiceWindow = new Window_ChoiceList(this);
        this._numberWindow = new Window_NumberInput(this);
        this._itemWindow = new Window_EventItem(this);
    }

    windowWidth(): number {
        return Graphics.boxWidth;
    }

    windowHeight(): number {
        return this.fittingHeight(this.numVisibleRows());
    }

    clearFlags(): void {
        this._showFast = false;
        this._lineShowFast = false;
        this._pauseSkip = false;
        this._textSpeed = 0;
        this._textSpeedCount = 0;
    }

    numVisibleRows(): number {
        return 4;
    }

    update(): void {
        this.checkToNotClose();
        super.update();
        while (!this.isOpening() && !this.isClosing()) {
            if (this.updateWait()) {
                return;
            } else if (this.updateLoading()) {
                return;
            } else if (this.updateInput()) {
                return;
            } else if (this.updateMessage()) {
                return;
            } else if (this.canStart()) {
                this.startMessage();
            } else {
                this.startInput();
                return;
            }
        }
    }

    checkToNotClose(): void {
        if (this.isClosing() && this.isOpen()) {
            if (this.doesContinue()) {
                this.open();
            }
        }
    }

    canStart(): boolean {
        return window.$gameMessage.hasText() && !window.$gameMessage.scrollMode();
    }

    startMessage(): void {
        this._textState = { index: 0 };
        this._textState.text = this.convertEscapeCharacters(window.$gameMessage.allText());
        this.newPage(this._textState);
        this.updatePlacement();
        this.updateBackground();
        this.open();
    }

    updatePlacement(): void {
        this._positionType = window.$gameMessage.positionType();
        this.y = (this._positionType * (Graphics.boxHeight - this.height)) / 2;
        this._goldWindow.y = this.y > 0 ? 0 : Graphics.boxHeight - this._goldWindow.height;
    }

    updateBackground(): void {
        this._background = window.$gameMessage.background();
        this.setBackgroundType(this._background);
    }

    terminateMessage(): void {
        this.close();
        this._goldWindow.close();
        window.$gameMessage.clear();
    }

    updateWait(): boolean {
        if (this._waitCount > 0) {
            this._waitCount--;
            return true;
        } else {
            return false;
        }
    }

    updateLoading(): boolean {
        if (this._faceBitmap) {
            if (this._faceBitmap.isReady()) {
                this.drawMessageFace();
                this._faceBitmap = null;
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    updateInput(): boolean {
        if (this.isAnySubWindowActive()) {
            return true;
        }
        if (this.pause) {
            if (this.isTriggered()) {
                Input.update();
                this.pause = false;
                if (!this._textState) {
                    this.terminateMessage();
                }
            }
            return true;
        }
        return false;
    }

    isAnySubWindowActive(): boolean {
        return this._choiceWindow.active || this._numberWindow.active || this._itemWindow.active;
    }

    updateMessage(): boolean {
        if (this._textState) {
            while (!this.isEndOfText(this._textState)) {
                if (this.needsNewPage(this._textState)) {
                    this.newPage(this._textState);
                }
                this.updateShowFast();
                if (!this._showFast && !this._lineShowFast && this._textSpeedCount < this._textSpeed) {
                    this._textSpeedCount++;
                    break;
                }
                this._textSpeedCount = 0;
                this.processCharacter(this._textState);
                if (!this._showFast && !this._lineShowFast && this._textSpeed !== -1) {
                    break;
                }
                if (this.pause || this._waitCount > 0) {
                    break;
                }
            }
            if (this.isEndOfText(this._textState)) {
                this.onEndOfText();
            }
            return true;
        } else {
            return false;
        }
    }

    onEndOfText(): void {
        if (!this.startInput()) {
            if (!this._pauseSkip) {
                this.startPause();
            } else {
                this.terminateMessage();
            }
        }
        this._textState = null;
    }

    startInput(): boolean {
        if (window.$gameMessage.isChoice()) {
            this._choiceWindow.start();
            return true;
        } else if (window.$gameMessage.isNumberInput()) {
            this._numberWindow.start();
            return true;
        } else if (window.$gameMessage.isItemChoice()) {
            this._itemWindow.start();
            return true;
        } else {
            return false;
        }
    }

    isTriggered(): boolean {
        return Input.isRepeated('ok') || Input.isRepeated('cancel') || TouchInput.isRepeated();
    }

    doesContinue(): boolean {
        return window.$gameMessage.hasText() && !window.$gameMessage.scrollMode() && !this.areSettingsChanged();
    }

    areSettingsChanged(): boolean {
        return (
            this._background !== window.$gameMessage.background() ||
            this._positionType !== window.$gameMessage.positionType()
        );
    }

    updateShowFast(): void {
        if (this.isTriggered()) {
            this._showFast = true;
        }
    }

    newPage(textState: TextState): void {
        this.contents.clear();
        this.resetFontSettings();
        this.clearFlags();
        this.loadMessageFace();
        textState.x = this.newLineX();
        textState.y = 0;
        textState.left = this.newLineX();
        textState.height = this.calcTextHeight(textState, false);
    }

    loadMessageFace(): void {
        this._faceBitmap = ImageManager.reserveFace(window.$gameMessage.faceName(), 0, this._imageReservationId);
    }

    drawMessageFace(): void {
        this.drawFace(window.$gameMessage.faceName(), window.$gameMessage.faceIndex(), 0, 0);
        ImageManager.releaseReservation(this._imageReservationId);
    }

    newLineX(): number {
        return window.$gameMessage.faceName() === '' ? 0 : 168;
    }

    processNewLine(textState: TextState): void {
        this._lineShowFast = false;
        super.processNewLine(textState);
        if (this.needsNewPage(textState)) {
            this.startPause();
        }
    }

    processNewPage(textState: TextState): void {
        super.processNewPage(textState);
        if (textState.text[textState.index] === '\n') {
            textState.index++;
        }
        textState.y = this.contents.height;
        this.startPause();
    }

    isEndOfText(textState: TextState): boolean {
        return textState.index >= textState.text.length;
    }

    needsNewPage(textState: TextState): boolean {
        return !this.isEndOfText(textState) && textState.y + textState.height > this.contents.height;
    }

    processEscapeCharacter(code: string, textState: TextState): void {
        switch (code) {
            case '$':
                this._goldWindow.open();
                break;
            case '.':
                this.startWait(15);
                break;
            case '|':
                this.startWait(60);
                break;
            case '!':
                this.startPause();
                break;
            case '>':
                this._lineShowFast = true;
                break;
            case '<':
                this._lineShowFast = false;
                break;
            case '^':
                this._pauseSkip = true;
                break;
            case 'S':
                this._textSpeed = this.obtainEscapeParam(textState) - 1;
                break;
            default:
                super.processEscapeCharacter(code, textState);
                break;
        }
    }

    startWait(count: number): void {
        this._waitCount = count;
    }

    startPause(): void {
        this.startWait(10);
        this.pause = true;
    }
}
