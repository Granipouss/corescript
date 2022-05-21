import type { EventPage } from './event-page';

export type Event = {
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
     * The x coordinate.
     */
    readonly x: number;

    /**
     * The y coordinate.
     */
    readonly y: number;

    readonly pages: readonly EventPage[];
};
