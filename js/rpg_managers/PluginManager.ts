/* eslint-disable @typescript-eslint/no-explicit-any */

type Plugin = any;

/**
 * The static class that manages the plugins.
 */
export const PluginManager = new (class PluginManager {
    private _path = 'js/plugins/';
    private _scripts: string[] = [];
    private _errorUrls: string[] = [];
    private _parameters: Record<string, any> = {};

    setup(plugins: Plugin[]): void {
        plugins.forEach((plugin) => {
            if (plugin.status && !this._scripts.includes(plugin.name)) {
                this.setParameters(plugin.name, plugin.parameters);
                this.loadScript(plugin.name + '.js');
                this._scripts.push(plugin.name);
            }
        });
    }

    checkErrors(): void {
        const url = this._errorUrls.shift();
        if (url) {
            throw new Error('Failed to load: ' + url);
        }
    }

    parameters(name: string): any {
        return this._parameters[name.toLowerCase()] || {};
    }

    setParameters(name: string, parameters: any): void {
        this._parameters[name.toLowerCase()] = parameters;
    }

    loadScript(name: string): void {
        const url = this._path + name;
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;
        script.onerror = (e: Event): void => this.onError(e, url);
        document.body.appendChild(script);
    }

    onError(_e: Event, url: string): void {
        this._errorUrls.push(url);
    }
})();
