import type { AudioFile } from './audio-file';
import type { RPGEvent } from './event';

export type RPGMap = {
    /**
     * The display name.
     */
    readonly displayName: string;

    /**
     * The tileset ID.
     */
    readonly tilesetId: number;

    /**
     * The width.
     */
    readonly width: number;

    /**
     * The height.
     */
    readonly height: number;

    /**
     * The scroll type.
     */
    readonly scrollType: number;

    /**
     * The "specify battleback" option.
     */
    readonly specifyBattleback: boolean;

    /**
     * The file name of the battle background floor image.
     */
    readonly battleback1Name: string;

    /**
     * The file name of the battle background wall image.
     */
    readonly battleback2Name: string;

    /**
     * The "autoplay BGM" option.
     */
    readonly autoplayBgm: boolean;

    /**
     * The BGM for autoplay.
     */
    readonly bgm: AudioFile;

    /**
     * The "autoplay BGS" option.
     */
    readonly autoplayBgs: boolean;

    /**
     * The BGS for autoplay.
     */
    readonly bgs: AudioFile;

    /**
     * The "disable dashing" option.
     */
    readonly disableDashing: boolean;

    /**
     * The list of encounters.
     */
    readonly encounterList: readonly MapEncounter[];

    /**
     * The encounter steps.
     */
    readonly encounterStep: number;

    /**
     * The file name of the parallax background image.
     */
    readonly parallaxName: string;

    /**
     * The "loop horizontally" option for the parallax background.
     */
    readonly parallaxLoopX: boolean;

    /**
     * The "loop vertically" option for the parallax background.
     */
    readonly parallaxLoopY: boolean;

    /**
     * The automatic x-axis scrolling speed for the parallax background.
     */
    readonly parallaxSx: number;

    /**
     * The automatic y-axis scrolling speed for the parallax background.
     */
    readonly parallaxSy: number;

    /**
     * The "show in the editor" option for the parallax background.
     */
    readonly parallaxShow: boolean;

    /**
     * The note.
     */
    readonly note: string;

    /**
     * The three-dimensional array containing the map data.
     */
    readonly data: readonly number[];

    /**
     * The list of events.
     */
    readonly events: readonly RPGEvent[];
};

export type MapEncounter = {
    /**
     * The troop ID.
     */
    readonly troopId: number;

    /**
     * The weight.
     */
    readonly weight: number;

    /**
     * The array of region IDs.
     */
    readonly regionSet: readonly number[];
};
