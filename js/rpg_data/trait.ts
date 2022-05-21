export type Trait = {
    /**
     * The trait code.
     */
    readonly code: number;

    /**
     * The ID of the data (such as elements or states) according to the type of the trait.
     */
    readonly dataId: number;

    /**
     * The value set according to the type of the trait.
     */
    readonly value: number;
};
