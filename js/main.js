//=============================================================================
// main.js
//=============================================================================

import './rpg_core/JsExtensions';

import { PluginManager } from './rpg_managers/PluginManager';
import { SceneManager } from './rpg_managers/SceneManager';

import { Scene_Boot } from './rpg_scenes/Scene_Boot';

var $plugins = [];

PluginManager.setup($plugins);

window.onload = function () {
    SceneManager.run(Scene_Boot);
};
