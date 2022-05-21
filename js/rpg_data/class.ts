import type { Trait } from './trait';

export type Class = {
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

    readonly traits: readonly Trait[];

    /**
     * The array of values that decides the EXP curve.
     */
    readonly expParams: readonly unknown[];

    /**
     * The two-dimensional array containing the parameter values according to level.
     */
    readonly params: readonly unknown[];

    /**
     * The skills to learn.
     */
    readonly learnings: readonly ClassLearning[];
};

export type ClassLearning = {
    /**
     * The level.
     */
    readonly level: number;

    /**
     * The ID of the skill to learn.
     */
    readonly skillId: number;

    /**
     * The note.
     */
    readonly note: string;
};
