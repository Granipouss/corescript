export type EventCommand = {
    /**
     * The command code.
     */
    readonly code: number;

    /**
     * The indent depth.
     */
    readonly indent: number;

    /**
     * The parameters according to the command code.
     */
    readonly parameters: readonly unknown[];
};
