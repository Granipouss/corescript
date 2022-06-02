import { Sprite } from '../rpg_core/Sprite';
import { SceneManager } from '../rpg_managers/SceneManager';
import { Game_Actor } from '../rpg_objects/Game_Actor';
import { Window_Help } from '../rpg_windows/Window_Help';
import { Scene_Base } from './Scene_Base';

/**
 * The superclass of all the menu-type scenes.
 */
export class Scene_MenuBase extends Scene_Base {
    protected _actor: Game_Actor;

    protected _backgroundSprite: Sprite;
    protected _helpWindow: Window_Help;

    create(): void {
        super.create();
        this.createBackground();
        this.updateActor();
        this.createWindowLayer();
    }

    actor(): Game_Actor {
        return this._actor;
    }

    updateActor(): void {
        this._actor = window.$gameParty.menuActor();
    }

    createBackground(): void {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);
    }

    setBackgroundOpacity(opacity: number) {
        this._backgroundSprite.opacity = opacity;
    }

    createHelpWindow(): void {
        this._helpWindow = new Window_Help();
        this.addWindow(this._helpWindow);
    }

    nextActor(): void {
        window.$gameParty.makeMenuActorNext();
        this.updateActor();
        this.onActorChange();
    }

    previousActor(): void {
        window.$gameParty.makeMenuActorPrevious();
        this.updateActor();
        this.onActorChange();
    }

    onActorChange(): void {
        // ...
    }
}
