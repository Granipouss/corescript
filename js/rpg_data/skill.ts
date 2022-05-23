import type { RPGDamage } from './damage';
import type { RPGEffect } from './effect';

export type RPGSkill = {
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
     */
    readonly damage: RPGDamage;

    /**
     * The list of effects.
     */
    readonly effects: readonly RPGEffect[];

    /**
     * The skill type ID.
     */
    readonly stypeId: number;

    /**
     * The MP cost.
     */
    readonly mpCost: number;

    /**
     * The TP cost.
     */
    readonly tpCost: number;

    /**
     * The message line 1.
     */
    readonly message1: string;

    /**
     * The message line 2.
     */
    readonly message2: string;

    /**
     * The required weapon type 1.
     */
    readonly requiredWtypeId1: number;

    /**
     * The required weapon type 2.
     */
    readonly requiredWtypeId2: number;
};
