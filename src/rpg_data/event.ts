import type { RPGEventPage } from './event-page';

export type RPGEvent = {
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

    /**
     * The list of pages.
     */
    readonly pages: readonly RPGEventPage[];
};
