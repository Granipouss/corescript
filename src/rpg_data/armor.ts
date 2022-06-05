import type { RPGTrait } from './trait';

export type RPGArmor = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The description.
     */
    readonly description: string;

    /**
     * The note.
     */
    readonly note: string;

    /**
     * The index of the icon image.
     */
    readonly iconIndex: number;

    readonly traits: readonly RPGTrait[];

    /**
     * The equipment type ID.
     */
    readonly etypeId: number;

    /**
     * The price.
     */
    readonly price: number;

    /**
     * The parameter changes.
     */
    readonly params: readonly number[];

    /**
     * The armor type ID.
     */
    readonly atypeId: number;
};
