/* global nw */

/**
 * The static class that defines utility methods.
 */
export const Utils = new (class Utils {
    /**
     * The name of the RPG Maker. 'MV' in the current version.
     *
     * @type String
     * @final
     */
    RPGMAKER_NAME = 'MV';

    /**
     * The version of the RPG Maker.
     *
     * @type String
     * @final
     */
    RPGMAKER_VERSION = '1.6.1';

    RPGMAKER_ENGINE = 'community-1.3b';

    /**
     * Checks whether the option is in the query string.
     *
     * @param {String} name The option name
     * @return {Boolean} True if the option is in the query string
     */
    isOptionValid(name) {
        if (location.search.slice(1).split('&').contains(name)) {
            return true;
        }
        if (typeof nw !== 'undefined' && nw.App.argv.length > 0 && nw.App.argv[0].split('&').contains(name)) {
            return true;
        }
        return false;
    }

    /**
     * Checks whether the platform is NW.js.
     *
     * @return {Boolean} True if the platform is NW.js
     */
    isNwjs() {
        return typeof require === 'function' && typeof process === 'object';
    }

    /**
     * Checks whether the platform is a mobile device.
     *
     * @return {Boolean} True if the platform is a mobile device
     */
    isMobileDevice() {
        const r = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return !!navigator.userAgent.match(r);
    }

    /**
     * Checks whether the browser is Mobile Safari.
     *
     * @return {Boolean} True if the browser is Mobile Safari
     */
    isMobileSafari() {
        const agent = navigator.userAgent;
        return !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) && !agent.match('CriOS'));
    }

    /**
     * Checks whether the browser is Android Chrome.
     *
     * @return {Boolean} True if the browser is Android Chrome
     */
    isAndroidChrome() {
        const agent = navigator.userAgent;
        return !!(agent.match(/Android/) && agent.match(/Chrome/));
    }

    /**
     * Checks whether the browser can read files in the game folder.
     *
     * @return {Boolean} True if the browser can read files in the game folder
     */
    canReadGameFiles() {
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
     * @param {Number} r The red value in the range (0, 255)
     * @param {Number} g The green value in the range (0, 255)
     * @param {Number} b The blue value in the range (0, 255)
     * @return {String} CSS color string
     */
    rgbToCssColor(r, g, b) {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    _id = 1;
    generateRuntimeId() {
        return this._id++;
    }

    _supportPassiveEvent = null;
    /**
     * Test this browser support passive event feature
     *
     * @return {Boolean} this browser support passive event or not
     */
    isSupportPassiveEvent() {
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
