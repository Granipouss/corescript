import type { Damage } from './damage';
import type { Effect } from './effect';

export type Item = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The description.
     */
    readonly description: string;

    /**
     * The note.
     */
    readonly note: string;

    /**
     * The index of the icon image.
     */
    readonly iconIndex: number;

    /**
     * The scope.
     */
    readonly scope: number;

    /**
     * The occasion.
     */
    readonly occasion: number;

    /**
     * The speed.
     */
    readonly speed: number;

    /**
     * The success rate.
     */
    readonly successRate: number;

    /**
     * The number of repeats.
     */
    readonly repeats: number;

    /**
     * The TP gain.
     */
    readonly tpGain: number;

    /**
     * The hit type.
     */
    readonly hitType: number;

    /**
     * The animation ID.
     */
    readonly animationId: number;

    /**
     * The damage.
     *
     */
    readonly damage: Damage;

    readonly effects: readonly Effect[];

    /**
     * The item type ID.
     */
    readonly itypeId: number;

    /**
     * The price.
     */
    readonly price: number;

    /**
     * The consume flag.
     */
    readonly consumable: boolean;
};
