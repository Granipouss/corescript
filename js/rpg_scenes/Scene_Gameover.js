import { Input } from '../rpg_core/Input';
import { Sprite } from '../rpg_core/Sprite';
import { TouchInput } from '../rpg_core/TouchInput';
import { AudioManager } from '../rpg_managers/AudioManager';
import { ImageManager } from '../rpg_managers/ImageManager';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Scene_Base } from './Scene_Base';
import { Scene_Title } from './Scene_Title';

/**
 * The scene class of the game over screen.
 */
export class Scene_Gameover extends Scene_Base {
    create() {
        super.create();
        this.playGameoverMusic();
        this.createBackground();
    }

    start() {
        super.start();
        this.startFadeIn(this.slowFadeSpeed(), false);
    }

    update() {
        if (this.isActive() && !this.isBusy() && this.isTriggered()) {
            this.gotoTitle();
        }
        super.update();
    }

    stop() {
        super.stop();
        this.fadeOutAll();
    }

    terminate() {
        super.terminate();
        AudioManager.stopAll();
    }

    playGameoverMusic() {
        AudioManager.stopBgm();
        AudioManager.stopBgs();
        AudioManager.playMe(global.$dataSystem.gameoverMe);
    }

    createBackground() {
        this._backSprite = new Sprite();
        this._backSprite.bitmap = ImageManager.loadSystem('GameOver');
        this.addChild(this._backSprite);
    }

    isTriggered() {
        return Input.isTriggered('ok') || TouchInput.isTriggered();
    }

    gotoTitle() {
        SceneManager.goto(Scene_Title);
    }
}
