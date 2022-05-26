export type AudioFile = {
    /**
     * The name.
     */
    readonly name: string;

    /**
     * The volume.
     */
    readonly volume: number;

    /**
     * The pitch.
     */
    readonly pitch: number;

    /**
     * The pan.
     */
    readonly pan?: number;

    /**
     * The pos.
     */
    pos?: number;
};
