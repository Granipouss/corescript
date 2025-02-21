import type { RPGEventCommand } from './event-command';
import type { RPGMoveRoute } from './move-route';

export type RPGEventPage = {
    /**
     * The conditions.
     */
    readonly conditions: RPGEventPageConditions;

    /**
     * The image.
     */
    readonly image: RPGEventPageImage;

    /**
     * The movement type.
     */
    readonly moveType: number;

    /**
     * The movement speed.
     */
    readonly moveSpeed: number;

    /**
     * The movement frequency.
     */
    readonly moveFrequency: number;

    /**
     * The movement route.
     */
    readonly moveRoute: RPGMoveRoute;

    /**
     * The "walking" option.
     */
    readonly walkAnime: boolean;

    /**
     * The "stepping" option.
     */
    readonly stepAnime: boolean;

    /**
     * The "direction fix" option.
     */
    readonly directionFix: boolean;

    /**
     * The "through" option.
     */
    readonly through: boolean;

    /**
     * The priority.
     */
    readonly priorityType: number;

    /**
     * The trigger.
     */
    readonly trigger: number;

    /**
     * The list of commands.
     */
    readonly list: readonly RPGEventCommand[];
};

export type RPGEventPageConditions = {
    /**
     * The boolean value indicating whether the first "switch" is valid.
     */
    readonly switch1Valid: boolean;

    /**
     * The boolean value indicating whether the second "switch" is valid.
     */
    readonly switch2Valid: boolean;

    /**
     * The boolean value indicating whether the "variable" is valid.
     */
    readonly variableValid: boolean;

    /**
     * The boolean value indicating whether the "self switch" is valid.
     */
    readonly selfSwitchValid: boolean;

    /**
     * The boolean value indicating whether the "item" is valid.
     */
    readonly itemValid: boolean;

    /**
     * The boolean value indicating whether the "actor" is valid.
     */
    readonly actorValid: boolean;

    /**
     * The first switch ID.
     */
    readonly switch1Id: number;

    /**
     * The second switch ID.
     */
    readonly switch2Id: number;

    /**
     * The variable ID.
     */
    readonly variableId: number;

    /**
     * The refrence value for the variable.
     */
    readonly variableValue: number;

    /**
     * The letter of the self switch.
     */
    readonly selfSwitchCh: string;

    /**
     * The item ID.
     */
    readonly itemId: number;

    /**
     * The actor ID.
     */
    readonly actorId: number;
};

export type RPGEventPageImage = {
    /**
     * The tile ID.
     */
    readonly tileId: number;

    /**
     * The file name of the character image.
     */
    readonly characterName: string;

    /**
     * The index of the character image.
     */
    readonly characterIndex: number;

    /**
     * The direction.
     */
    readonly direction: number;

    /**
     * The pattern index.
     */
    readonly pattern: number;
};
