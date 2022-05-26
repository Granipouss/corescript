import * as PIXI from 'pixi.js';
import { clamp } from './extension';

/**
 * The color matrix filter for WebGL.
 */
export class ToneFilter extends PIXI.filters.ColorMatrixFilter {
    /**
     * Changes the hue.
     *
     * @method adjustHue
     * @param {Number} value The hue value in the range (-360, 360)
     */
    adjustHue(value) {
        this.hue(value, true);
    }

    /**
     * Changes the saturation.
     *
     * @method adjustSaturation
     * @param {Number} value The saturation value in the range (-255, 255)
     */
    adjustSaturation(value) {
        value = clamp(value || 0, [-255, 255]) / 255;
        this.saturate(value, true);
    }

    /**
     * Changes the tone.
     *
     * @method adjustTone
     * @param {Number} r The red strength in the range (-255, 255)
     * @param {Number} g The green strength in the range (-255, 255)
     * @param {Number} b The blue strength in the range (-255, 255)
     */
    adjustTone(r, g, b) {
        r = clamp(r || 0, [-255, 255]) / 255;
        g = clamp(g || 0, [-255, 255]) / 255;
        b = clamp(b || 0, [-255, 255]) / 255;

        if (r !== 0 || g !== 0 || b !== 0) {
            const matrix = [1, 0, 0, r, 0, 0, 1, 0, g, 0, 0, 0, 1, b, 0, 0, 0, 0, 1, 0];

            this._loadMatrix(matrix, true);
        }
    }
}
