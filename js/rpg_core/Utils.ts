// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const nw: any;

/**
 * The static class that defines utility methods.
 */
export const Utils = new (class Utils {
    /**
     * The name of the RPG Maker. 'MV' in the current version.
     */
    readonly RPGMAKER_NAME = 'MV';

    /**
     * The version of the RPG Maker.
     */
    readonly RPGMAKER_VERSION = '1.6.1';

    readonly RPGMAKER_ENGINE = 'community-1.3b';

    /**
     * Checks whether the option is in the query string.
     * @param name The option name
     */
    isOptionValid(name: string): boolean {
        if (location.search.slice(1).split('&').includes(name)) {
            return true;
        }
        if (typeof nw !== 'undefined' && nw.App.argv.length > 0 && nw.App.argv[0].split('&').includes(name)) {
            return true;
        }
        return false;
    }

    /**
     * Checks whether the platform is NW.js.
     */
    isNwjs(): boolean {
        return typeof require === 'function' && typeof process === 'object';
    }

    /**
     * Checks whether the platform is a mobile device.
     */
    isMobileDevice(): boolean {
        const r = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return !!navigator.userAgent.match(r);
    }

    /**
     * Checks whether the browser is Mobile Safari.
     */
    isMobileSafari(): boolean {
        const agent = navigator.userAgent;
        return !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) && !agent.match('CriOS'));
    }

    /**
     * Checks whether the browser is Android Chrome.
     */
    isAndroidChrome(): boolean {
        const agent = navigator.userAgent;
        return !!(agent.match(/Android/) && agent.match(/Chrome/));
    }

    /**
     * Checks whether the browser can read files in the game folder.
     */
    canReadGameFiles(): boolean {
        const scripts = document.getElementsByTagName('script');
        const lastScript = scripts[scripts.length - 1];
        const xhr = new XMLHttpRequest();
        try {
            xhr.open('GET', lastScript.src);
            xhr.overrideMimeType('text/javascript');
            xhr.send();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Makes a CSS color string from RGB values.
     *
     * @param r The red value in the range (0, 255)
     * @param g The green value in the range (0, 255)
     * @param b The blue value in the range (0, 255)
     * @return CSS color string
     */
    rgbToCssColor(r: number, g: number, b: number): string {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    private _id = 1;
    generateRuntimeId() {
        return this._id++;
    }

    private _supportPassiveEvent: boolean | null = null;
    /**
     * Test this browser support passive event feature
     *
     * @return {Boolean} this browser support passive event or not
     */
    isSupportPassiveEvent(): boolean {
        if (typeof this._supportPassiveEvent === 'boolean') {
            return this._supportPassiveEvent;
        }
        // test support passive event
        // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
        let passive = false;
        const options = Object.defineProperty({}, 'passive', {
            get: function () {
                passive = true;
                return void 0;
            },
        });
        window.addEventListener('test', null, options);
        this._supportPassiveEvent = passive;
        return passive;
    }
})();
