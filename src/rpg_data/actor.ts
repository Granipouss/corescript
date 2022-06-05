import type { RPGTrait } from './trait';

export type RPGActor = {
    /**
     * The ID.
     */
    readonly id: number;

    /**
     * The name.
     */
    readonly name: string;

    /**
     * The profile.
     */
    readonly profile: string;

    /**
     * The note.
     */
    readonly note: string;

    /**
     * The list of traits.
     */
    readonly traits: readonly RPGTrait[];

    /**
     * The nickname.
     */
    readonly nickname: string;

    /**
     * The class ID.
     */
    readonly classId: number;

    /**
     * The initial level.
     */
    readonly initialLevel: number;

    /**
     * The max level.
     */
    readonly maxLevel: number;

    /**
     * The file name of the character image.
     */
    readonly characterName: string;

    /**
     * The index of the character image.
     */
    readonly characterIndex: number;

    /**
     * The file name of the face image.
     */
    readonly faceName: string;

    /**
     * The index of the face image.
     */
    readonly faceIndex: number;

    /**
     * The file name of the side-view battler image.
     */
    readonly battlerName: string;

    /**
     * The initial equipment.
     */
    readonly equips: readonly number[];
};
