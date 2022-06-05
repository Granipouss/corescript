import type { RPGMoveCommand } from './move-command';

export type RPGMoveRoute = {
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

    /**
     * The list of commands.
     */
    readonly list: readonly RPGMoveCommand[];
};
