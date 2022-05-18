/**
 * The static class that manages the plugins.
 */
export const PluginManager = new (class PluginManager {
    _path = 'js/plugins/';
    _scripts = [];
    _errorUrls = [];
    _parameters = {};

    setup(plugins) {
        plugins.forEach(function (plugin) {
            if (plugin.status && !this._scripts.contains(plugin.name)) {
                this.setParameters(plugin.name, plugin.parameters);
                this.loadScript(plugin.name + '.js');
                this._scripts.push(plugin.name);
            }
        }, this);
    }

    checkErrors() {
        var url = this._errorUrls.shift();
        if (url) {
            throw new Error('Failed to load: ' + url);
        }
    }

    parameters(name) {
        return this._parameters[name.toLowerCase()] || {};
    }

    setParameters(name, parameters) {
        this._parameters[name.toLowerCase()] = parameters;
    }

    loadScript(name) {
        var url = this._path + name;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;
        script.onerror = this.onError.bind(this);
        script._url = url;
        document.body.appendChild(script);
    }

    onError(e) {
        this._errorUrls.push(e.target._url);
    }
})();
