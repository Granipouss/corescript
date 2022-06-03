import * as PIXI from 'pixi.js';

import { Graphics } from '../rpg_core/Graphics';
import { ScreenSprite } from '../rpg_core/ScreenSprite';
import { Utils } from '../rpg_core/Utils';
import { WindowLayer } from '../rpg_core/WindowLayer';
import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import type { Window_Base } from '../rpg_windows/Window_Base';
import { Scene_Gameover } from './Scene_Gameover';

/**
 * The Superclass of all scene within the game.
 */
export abstract class Scene_Base extends PIXI.Container {
    protected _active: boolean;
    protected _fadeSign: number;
    protected _fadeDuration: number;
    protected _fadeSprite: ScreenSprite;
    protected _imageReservationId: number;

    protected _windowLayer: WindowLayer;

    /**
     * Create a instance of Scene_Base.
     */
    constructor() {
        super();

        // The interactive flag causes a memory leak.
        this.interactive = false;

        this._active = false;
        this._fadeSign = 0;
        this._fadeDuration = 0;
        this._fadeSprite = null;
        this._imageReservationId = Utils.generateRuntimeId();
    }

    /**
     * Attach a reservation to the reserve queue.
     */
    attachReservation(): void {
        ImageManager.setDefaultReservationId(this._imageReservationId);
    }

    /**
     * Remove the reservation from the Reserve queue.
     */
    detachReservation(): void {
        ImageManager.releaseReservation(this._imageReservationId);
    }

    prepare(..._args: unknown[]): void {
        // ...
    }

    /**
     * Create the components and add them to the rendering process.
     */
    create(): void {
        // ...
    }

    /**
     * Returns whether the scene is active or not.
     */
    isActive(): boolean {
        return this._active;
    }

    /**
     * Return whether the scene is ready to start or not.
     */
    isReady(): boolean {
        return ImageManager.isReady();
    }

    /**
     * Start the scene processing.
     */
    start(): void {
        this._active = true;
    }

    /**
     * Update the scene processing each new frame.
     */
    update(): void {
        this.updateFade();
        this.updateChildren();
    }

    /**
     * Stop the scene processing.
     */
    stop(): void {
        this._active = false;
    }

    /**
     * Return whether the scene is busy or not.
     *
     * @method isBusy
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if the scene is currently busy
     */
    isBusy(): boolean {
        return this._fadeDuration > 0;
    }

    /**
     * Terminate the scene before switching to a another scene.
     */
    terminate(): void {
        // ...
    }

    /**
     * Create the layer for the windows children
     * and add it to the rendering process.
     */
    createWindowLayer(): void {
        const width = Graphics.boxWidth;
        const height = Graphics.boxHeight;
        const x = (Graphics.width - width) / 2;
        const y = (Graphics.height - height) / 2;
        this._windowLayer = new WindowLayer();
        this._windowLayer.move(x, y, width, height);
        this.addChild(this._windowLayer);
    }

    /**
     * Add the children window to the windowLayer processing.
     */
    addWindow(window: Window_Base): void {
        window.initialize(window.x, window.y, window.width, window.height);
        this._windowLayer.addChild(window);
    }

    /**
     * Request a fadeIn screen process.
     * @param duration The time the process will take for fadeIn the screen
     * @param white If true the fadein will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Scene_Base
     */
    startFadeIn(duration = 30, white = false): void {
        this.createFadeSprite(white);
        this._fadeSign = 1;
        this._fadeDuration = duration || 30;
        this._fadeSprite.opacity = 255;
    }

    /**
     * Request a fadeOut screen process.
     * @param duration The time the process will take for fadeOut the screen
     * @param white If true the fadeOut will be process with a white color else it's will be black
     */
    startFadeOut(duration = 30, white = false): void {
        this.createFadeSprite(white);
        this._fadeSign = -1;
        this._fadeDuration = duration || 30;
        this._fadeSprite.opacity = 0;
    }

    /**
     * Create a Screen sprite for the fadein and fadeOut purpose and
     * add it to the rendering process.
     */
    createFadeSprite(white = false): void {
        if (!this._fadeSprite) {
            this._fadeSprite = new ScreenSprite();
            this.addChild(this._fadeSprite);
        }
        if (white) {
            this._fadeSprite.setWhite();
        } else {
            this._fadeSprite.setBlack();
        }
    }

    /**
     * Update the screen fade processing.
     */
    updateFade(): void {
        if (this._fadeDuration > 0) {
            const d = this._fadeDuration;
            if (this._fadeSign > 0) {
                this._fadeSprite.opacity -= this._fadeSprite.opacity / d;
            } else {
                this._fadeSprite.opacity += (255 - this._fadeSprite.opacity) / d;
            }
            this._fadeDuration--;
        }
    }

    /**
     * Update the children of the scene EACH frame.
     */
    updateChildren(): void {
        this.children.forEach((child: PIXI.DisplayObject & { update?: () => void }) => {
            if (child.update) {
                child.update();
            }
        });
    }

    /**
     * Pop the scene from the stack array and switch to the
     * previous scene.
     */
    popScene(): void {
        SceneManager.pop();
    }

    /**
     * Check whether the game should be triggering a gameover.
     */
    checkGameover(): void {
        if (window.$gameParty.isAllDead()) {
            SceneManager.goto(Scene_Gameover);
        }
    }

    /**
     * Slowly fade out all the visual and audio of the scene.
     */
    fadeOutAll(): void {
        const time = this.slowFadeSpeed() / 60;
        AudioManager.fadeOutBgm(time);
        AudioManager.fadeOutBgs(time);
        AudioManager.fadeOutMe(time);
        this.startFadeOut(this.slowFadeSpeed());
    }

    /**
     * Return the screen fade speed value.
     */
    fadeSpeed(): number {
        return 24;
    }

    /**
     * Return a slow screen fade speed value.
     */
    slowFadeSpeed(): number {
        return this.fadeSpeed() * 2;
    }
}
