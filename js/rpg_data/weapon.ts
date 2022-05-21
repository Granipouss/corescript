import type { Trait } from './trait';

export type Weapon = {
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

    readonly traits: readonly Trait[];

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
    readonly params: readonly unknown[];

    /**
     * The weapon type ID.
     */
    readonly wtypeId: number;

    /**
     * The animation ID.
     */
    readonly animationId: number;
};
