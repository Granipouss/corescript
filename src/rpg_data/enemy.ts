import type { RPGTrait } from './trait';

export type RPGEnemy = {
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
     * The list of traits.
     */
    readonly traits: readonly RPGTrait[];

    /**
     * The file name of the enemy image.
     */
    readonly battlerName: string;

    /**
     * The hue rotation value of the enemy image.
     */
    readonly battlerHue: number;

    /**
     * The parameters.
     */
    readonly params: readonly number[];

    /**
     * The EXP.
     */
    readonly exp: number;

    /**
     * The gold.
     */
    readonly gold: number;

    /**
     * The list fo dropped items.
     */
    readonly dropItems: readonly RPGEnemyDropItem[];

    /**
     * The list of actions.
     */
    readonly actions: readonly RPGEnemyAction[];
};

export type RPGEnemyDropItem = {
    /**
     * The kind of the item.
     */
    readonly kind: number;

    /**
     * The ID of the data depending on the kind.
     */
    readonly dataId: number;

    /**
     * The N of the probability 1/N that the item will be dropped.
     */
    readonly denominator: number;
};

export type RPGEnemyAction = {
    /**
     * The skill ID.
     */
    readonly skillId: number;

    /**
     * The condition type.
     */
    readonly conditionType: number;

    /**
     * The first parameter of the condition.
     */
    readonly conditionParam1: number;

    /**
     * The second parameter of the condition.
     */
    readonly conditionParam2: number;

    /**
     * The rating.
     */
    readonly rating: number;
};
