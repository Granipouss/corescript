/* eslint-disable @typescript-eslint/no-explicit-any */

export type RPGMoveCommand = {
    /**
     * The command code.
     */
    readonly code: number;

    /**
     * The parameters according to the command code.
     */
    readonly parameters: readonly any[];
};
