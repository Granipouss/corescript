import * as PIXI from 'pixi.js';

export class DisplayObject extends PIXI.DisplayObject {
    update?: () => void;

    spriteId?: number;
    z?: number;
}
