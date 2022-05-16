import { Sprite } from '../rpg_core/Sprite';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Window_Help } from '../rpg_windows/Window_Help';
import { Scene_Base } from './Scene_Base';

/**
 * The superclass of all the menu-type scenes.
 */
export class Scene_MenuBase extends Scene_Base {
    create() {
        super.create();
        this.createBackground();
        this.updateActor();
        this.createWindowLayer();
    }

    actor() {
        return this._actor;
    }

    updateActor() {
        this._actor = global.$gameParty.menuActor();
    }

    createBackground() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);
    }

    setBackgroundOpacity(opacity) {
        this._backgroundSprite.opacity = opacity;
    }

    createHelpWindow() {
        this._helpWindow = new Window_Help();
        this.addWindow(this._helpWindow);
    }

    nextActor() {
        global.$gameParty.makeMenuActorNext();
        this.updateActor();
        this.onActorChange();
    }

    previousActor() {
        global.$gameParty.makeMenuActorPrevious();
        this.updateActor();
        this.onActorChange();
    }

    onActorChange() {}
}
