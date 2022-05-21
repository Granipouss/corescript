import type { BattleEventPage } from './battle-event-page';

export type Troop = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    readonly members: readonly TroopMember[];

    readonly pages: readonly BattleEventPage[];
};

export type TroopMember = {
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
