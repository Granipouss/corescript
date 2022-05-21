import type { EventCommand } from './event-command';

export type BattleEventPage = {
    /**
     * The conditions.
     */
    readonly conditions: BattleEventPageConditions;

    /**
     * The span.
     */
    readonly span: number;

    readonly list: readonly EventCommand[];
};

export type BattleEventPageConditions = {
    /**
     * The boolean value indicating whether the "turn end" is valid.
     */
    readonly turnEnding: boolean;

    /**
     * The boolean value indicating whether the "turn" is valid.
     */
    readonly turnValid: boolean;

    /**
     * The boolean value indicating whether the "enemy HP" is valid.
     */
    readonly enemyValid: boolean;

    /**
     * The boolean value indicating whether the "actor HP" is valid.
     */
    readonly actorValid: boolean;

    /**
     * The boolean value indicating whether the "switch" is valid.
     */
    readonly switchValid: boolean;

    /**
     * The turn condition value A.
     */
    readonly turnA: number;

    /**
     * The turn condition value B.
     */
    readonly turnB: number;

    /**
     * The enemy index.
     */
    readonly enemyIndex: number;

    /**
     * The percentage of enemy HP.
     */
    readonly enemyHp: number;

    /**
     * The actor ID.
     */
    readonly actorId: number;

    /**
     * The percentage of actor HP.
     */
    readonly actorHp: number;

    /**
     * The switch ID.
     */
    readonly switchId: number;
};
