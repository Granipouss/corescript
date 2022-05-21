export type MoveCommand = {
    /**
     * The command code.
     */
    readonly code: number;

    /**
     * The parameters according to the command code.
     */
    readonly parameters: readonly unknown[];
};
