import type { MoveCommand } from './move-command';

export type MoveRoute = {
    /**
     * The "repeat movements" option.
     */
    readonly repeat: boolean;

    /**
     * The "skip if cannot move" option.
     */
    readonly skippable: boolean;

    /**
     * The "wait for completion" option.
     */
    readonly wait: boolean;

    readonly list: readonly MoveCommand[];
};
