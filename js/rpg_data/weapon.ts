import type { RPGTrait } from './trait';

export type RPGWeapon = {
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

    /**
     * The list of traits.
     */
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
     * The weapon type ID.
     */
    readonly wtypeId: number;

    /**
     * The animation ID.
     */
    readonly animationId: number;
};
