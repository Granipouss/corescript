import type { RPGBattleEventPage } from './battle-event-page';

export type RPGTroop = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The list of members.
     */
    readonly members: readonly RPGTroopMember[];

    /**
     * The list of pages.
     */
    readonly pages: readonly RPGBattleEventPage[];
};

export type RPGTroopMember = {
    /**
     * The enemy ID.
     */
    readonly enemyId: number;

    /**
     * The x coordinate.
     */
    readonly x: number;

    /**
     * The y coordinate.
     */
    readonly y: number;

    /**
     * The "appear halfway" option.
     */
    readonly hidden: boolean;
};
