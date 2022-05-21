import type { EventCommand } from './event-command';

export type CommonEvent = {
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

    readonly list: readonly EventCommand[];
};
