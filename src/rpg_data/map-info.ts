export type RPGMapInfo = {
    /**
     * The name.
     */
    readonly name: string;

    /**
     * The parent map ID.
     */
    readonly parentId: number;

    /**
     * The order in the map tree.
     */
    readonly order: number;

    /**
     * The expansion flag in the map tree.
     */
    readonly expanded: boolean;

    /**
     * The horizontal scroll position in the map editor.
     */
    readonly scrollX: boolean;

    /**
     * The vertical scroll position in the map editor.
     */
    readonly scrollY: boolean;
};
