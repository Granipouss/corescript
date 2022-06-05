import * as PIXI from 'pixi.js';
import { clamp } from './extension';

/**
 * The color matrix filter for WebGL.
 */
export class ToneFilter extends PIXI.filters.ColorMatrixFilter {
    /**
     * Changes the hue.
     * @param value The hue value in the range (-360, 360)
     */
    adjustHue(value: number): void {
        this.hue(value, true);
    }

    /**
     * Changes the saturation.
     * @param value The saturation value in the range (-255, 255)
     */
    adjustSaturation(value: number): void {
        value = clamp(value || 0, [-255, 255]) / 255;
        this.saturate(value, true);
    }

    /**
     * Changes the tone.
     * @param r The red strength in the range (-255, 255)
     * @param g The green strength in the range (-255, 255)
     * @param b The blue strength in the range (-255, 255)
     */
    adjustTone(r = 0, g = 0, b = 0): void {
        r = clamp(r || 0, [-255, 255]) / 255;
        g = clamp(g || 0, [-255, 255]) / 255;
        b = clamp(b || 0, [-255, 255]) / 255;

        if (r !== 0 || g !== 0 || b !== 0) {
            const matrix = [1, 0, 0, r, 0, 0, 1, 0, g, 0, 0, 0, 1, b, 0, 0, 0, 0, 1, 0];

            this._loadMatrix(matrix, true);
        }
    }
}
