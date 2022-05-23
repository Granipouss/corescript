export type RPGEffect = {
    /**
     * The effect code.
     */
    readonly code: number;

    /**
     * The ID of the data (such as elements or states) according to the type of the effect.
     */
    readonly dataId: number;

    /**
     * The value 1 set according to the type of the effect.
     */
    readonly value1: number;

    /**
     * The value 2 set according to the type of the effect.
     */
    readonly value2: number;
};
