//=============================================================================
// main.js
//=============================================================================

import { PluginManager } from './rpg_managers/PluginManager';
import { SceneManager } from './rpg_managers/SceneManager';

import { Scene_Boot } from './rpg_scenes/Scene_Boot';

const $plugins: unknown[] = [];

PluginManager.setup($plugins);

window.onload = function (): void {
    SceneManager.run(Scene_Boot);
};
