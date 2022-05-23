export type RPGDamage = {
    /**
     * The type.
     */
    readonly type: number;

    /**
     * The element ID.
     */
    readonly elementId: number;

    /**
     * The formula.
     */
    readonly formula: string;

    /**
     * The variance.
     */
    readonly variance: number;

    /**
     * The critical hit flag.
     */
    readonly critical: boolean;
};
