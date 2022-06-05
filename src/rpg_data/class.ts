import type { RPGTrait } from './trait';

export type RPGClass = {
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
     * The array of values that decides the EXP curve.
     */
    readonly expParams: readonly [number, number, number, number];

    /**
     * The two-dimensional array containing the parameter values according to level.
     */
    readonly params: readonly number[][];

    /**
     * The skills to learn.
     */
    readonly learnings: readonly RPGClassLearning[];
};

export type RPGClassLearning = {
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
