//=============================================================================
// main.js
//=============================================================================

var $plugins = [];

PluginManager.setup($plugins);

window.onload = function () {
    SceneManager.run(Scene_Boot);
};
