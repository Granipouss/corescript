import type { RPGTrait } from './trait';

export type RPGState = {
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
     * The index of the icon image.
     */
    readonly iconIndex: number;

    /**
     * The list of traits.
     */
    readonly traits: readonly RPGTrait[];

    /**
     * The restriction.
     */
    readonly restriction: number;

    /**
     * The priority.
     */
    readonly priority: number;

    /**
     * The side-view motion.
     */
    readonly motion: number;

    /**
     * The side-view overlay.
     */
    readonly overlay: number;

    /**
     * The "remove at battle end" option.
     */
    readonly removeAtBattleEnd: boolean;

    /**
     * The "remove by restriction" option.
     */
    readonly removeByRestriction: boolean;

    /**
     * The auto-removal timing.
     */
    readonly autoRemovalTiming: number;

    /**
     * The minimum turns of the duration.
     */
    readonly minTurns: number;

    /**
     * The maximum turns of the duration.
     */
    readonly maxTurns: number;

    /**
     * The "remove by damage" option.
     */
    readonly removeByDamage: boolean;

    /**
     * The probability of the state removal by damage.
     */
    readonly chanceByDamage: number;

    /**
     * The "remove by walking" option.
     */
    readonly removeByWalking: boolean;

    /**
     * The number of steps until the state is removed.
     */
    readonly stepsToRemove: number;

    /**
     * The message when an actor fell in the state.
     */
    readonly message1: string;

    /**
     * The message when an enemy fell in the state.
     */
    readonly message2: string;

    /**
     * The message when the state remains.
     */
    readonly message3: string;

    /**
     * The message when the state is removed.
     */
    readonly message4: string;
};
