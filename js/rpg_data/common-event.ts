import type { RPGEventCommand } from './event-command';

export type RPGCommonEvent = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The trigger.
     */
    readonly trigger: number;

    /**
     * The switch ID.
     */
    readonly switchId: number;

    /**
     * The list of commands.
     */
    readonly list: readonly RPGEventCommand[];
};
