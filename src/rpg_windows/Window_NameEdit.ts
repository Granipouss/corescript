import { Graphics } from '../rpg_core/Graphics';
import { ImageManager } from '../rpg_managers/ImageManager';
import type { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Base } from './Window_Base';

/**
 * The window for editing an actor's name on the name input screen.
 */
export class Window_NameEdit extends Window_Base {
    protected _actor: Game_Actor;
    protected _name: string;
    protected _index: number;
    protected _maxLength: number;
    protected _defaultName: string;

    constructor(actor: Game_Actor, maxLength: number) {
        super();

        this._actor = actor;
        this._name = actor.name().slice(0, this._maxLength);
        this._index = this._name.length;
        this._maxLength = maxLength;
        this._defaultName = this._name;

        ImageManager.reserveFace(actor.faceName());
    }

    initialize(): void {
        const width = this.windowWidth();
        const height = this.windowHeight();
        const x = (Graphics.boxWidth - width) / 2;
        const y = (Graphics.boxHeight - (height + this.fittingHeight(9) + 8)) / 2;
        super.initialize(x, y, width, height);
        this.deactivate();
        this.refresh();
    }

    windowWidth(): number {
        return 480;
    }

    windowHeight(): number {
        return this.fittingHeight(4);
    }

    getName(): string {
        return this._name;
    }

    restoreDefault(): boolean {
        this._name = this._defaultName;
        this._index = this._name.length;
        this.refresh();
        return this._name.length > 0;
    }

    add(ch: string): boolean {
        if (this._index < this._maxLength) {
            this._name += ch;
            this._index++;
            this.refresh();
            return true;
        } else {
            return false;
        }
    }

    back(): boolean {
        if (this._index > 0) {
            this._index--;
            this._name = this._name.slice(0, this._index);
            this.refresh();
            return true;
        } else {
            return false;
        }
    }

    faceWidth(): number {
        return 144;
    }

    charWidth(): number {
        const text = window.$gameSystem.isJapanese() ? '\uff21' : 'A';
        return this.textWidth(text);
    }

    left(): number {
        const nameCenter = (this.contentsWidth() + this.faceWidth()) / 2;
        const nameWidth = (this._maxLength + 1) * this.charWidth();
        return Math.min(nameCenter - nameWidth / 2, this.contentsWidth() - nameWidth);
    }

    itemRect(index: number): PIXI.Rectangle {
        return new PIXI.Rectangle(this.left() + index * this.charWidth(), 54, this.charWidth(), this.lineHeight());
    }

    underlineRect(index: number): PIXI.Rectangle {
        const rect = this.itemRect(index);
        rect.x++;
        rect.y += rect.height - 4;
        rect.width -= 2;
        rect.height = 2;
        return rect;
    }

    underlineColor(): string {
        return this.normalColor();
    }

    drawUnderline(index: number): void {
        const rect = this.underlineRect(index);
        const color = this.underlineColor();
        this.contents.paintOpacity = 48;
        this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
        this.contents.paintOpacity = 255;
    }

    drawChar(index: number): void {
        const rect = this.itemRect(index);
        this.resetTextColor();
        this.drawText(this._name[index] || '', rect.x, rect.y);
    }

    refresh(): void {
        this.contents.clear();
        this.drawActorFace(this._actor, 0, 0);
        for (let i = 0; i < this._maxLength; i++) {
            this.drawUnderline(i);
        }
        for (let j = 0; j < this._name.length; j++) {
            this.drawChar(j);
        }
        const rect = this.itemRect(this._index);
        this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
    }
}
