import type { AudioFile } from './audio-file';

export type Animation = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The file name of the first animation image.
     */
    readonly animation1Name: string;

    /**
     * The hue rotation value of the first animation image.
     */
    readonly animation1Hue: number;

    /**
     * The file name of the second animation image.
     */
    readonly animation2Name: string;

    /**
     * The hue rotation value of the second animation image.
     */
    readonly animation2Hue: number;

    /**
     * The position.
     */
    readonly position: number;

    /**
     * The three-dimensional array containing the frame contents.
     */
    readonly frames: readonly unknown[];

    readonly timings: readonly AnimationTiming[];
};

export type AnimationTiming = {
    /**
     * The frame index.
     */
    readonly frame: number;

    /**
     * The SE.
     */
    readonly se: AudioFile;

    /**
     * The flash scope.
     */
    readonly flashScope: number;

    /**
     * The flash color.
     */
    readonly flashColor: [number, number, number, number];

    /**
     * The flash duration.
     */
    readonly flashDuration: number;
};
