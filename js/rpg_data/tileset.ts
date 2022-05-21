export type Tileset = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The note.
     */
    readonly note: string;

    /**
     * The mode.
     */
    readonly mode: number;

    /**
     * The file names of the tileset images.
     */
    readonly tilesetNames: readonly string[];

    /**
     * The tile flags.
     */
    readonly flags: readonly number[];
};
