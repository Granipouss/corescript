import type { AudioFile } from './audio-file';

export type RPGSystem = {
    /**
     * The game title.
     */
    readonly gameTitle: string;

    /**
     * The random number used for update check.
     */
    readonly versionId: number;

    /**
     * The locale string such as "ja_JP" and "en_US".
     */
    readonly locale: string;

    /**
     * The array of actor IDs in the starting party.
     */
    readonly partyMembers: readonly number[];

    /**
     * The currency unit.
     */
    readonly currencyUnit: string;

    /**
     * The window color.
     */
    readonly windowTone: [number, number, number, number];

    /**
     * The boat settings.
     */
    readonly boat: RPGSystemVehicle;

    /**
     * The ship settings.
     */
    readonly ship: RPGSystemVehicle;

    /**
     * The airship settings.
     */
    readonly airship: RPGSystemVehicle;

    /**
     * The file name of the background image in the title screen.
     */
    readonly title1Name: string;

    /**
     * The file name of the frame image in the title screen.
     */
    readonly title2Name: string;

    /**
     * The "draw game title" option.
     */
    readonly optDrawTitle: boolean;

    /**
     * The "use side-view battle" option.
     */
    readonly optSideView: boolean;

    /**
     * The "start transparent" option.
     */
    readonly optTransparent: boolean;

    /**
     * The "show player followers" option.
     */
    readonly optFollowers: boolean;

    /**
     * The "knockout by slip damage" option.
     */
    readonly optSlipDeath: boolean;

    /**
     * The "knockout by floor damage" option.
     */
    readonly optFloorDeath: boolean;

    /**
     * The "display TP in battle" option.
     */
    readonly optDisplayTp: boolean;

    /**
     * The "EXP for reserve members" option.
     */
    readonly optExtraExp: boolean;

    /**
     * The title BGM.
     */
    readonly titleBgm: AudioFile;

    /**
     * The battle BGM.
     */
    readonly battleBgm: AudioFile;

    /**
     * The victory ME.
     */
    readonly victoryMe: AudioFile;

    /**
     * The defeat ME.
     */
    readonly defeatMe: AudioFile;

    /**
     * The game over ME.
     */
    readonly gameoverMe: AudioFile;

    /**
     * for sound effects.
     */
    readonly sounds: readonly AudioFile[];

    /**
     * The menu commands.
     */
    readonly menuCommands: readonly unknown[];

    /**
     * The map ID of the player's starting position.
     */
    readonly startMapId: number;

    /**
     * The x coordinate of the player's starting position.
     */
    readonly startX: number;

    /**
     * The y coordinate of the player's starting position.
     */
    readonly startY: number;

    /**
     * The array of skill type IDs for magic skills.
     */
    readonly magicSkills: readonly number[];

    readonly attackMotions: readonly RPGSystemAttackMotion[];

    /**
     * The list of the elements.
     */
    readonly elements: readonly string[];

    /**
     * The list of the skill types.
     */
    readonly skillTypes: readonly string[];

    /**
     * The list of the weapon types.
     */
    readonly weaponTypes: readonly string[];

    /**
     * The list of the armor types.
     */
    readonly armorTypes: readonly string[];

    /**
     * The list of the equipment types.
     */
    readonly equipTypes: readonly string[];

    /**
     * The list of the switch names.
     */
    readonly switches: readonly string[];

    /**
     * The list of the variable names.
     */
    readonly variables: readonly string[];

    /**
     * The terms.
     */
    readonly terms: RPGSystemTerms;

    readonly testBattlers: readonly RPGSystemTestBattler[];

    /**
     * The troop ID for battle tests.
     */
    readonly testTroopId: number;

    /**
     * The file name of the battle background floor image for battle tests.
     */
    readonly battleback1Name: string;

    /**
     * The file name of the battle background wall image for battle tests.
     */
    readonly battleback2Name: string;

    /**
     * The file name of the enemy image for use in editing animations.
     */
    readonly battlerName: string;

    /**
     * The hue rotation value of the enemy image for use in editing animations.
     */
    readonly battlerHue: number;

    /**
     * The ID of the map currently being edited.
     */
    readonly editMapId: number;
};

export type RPGSystemVehicle = {
    /**
     * The file name of the character image.
     */
    readonly characterName: string;

    /**
     * The index of the character image.
     */
    readonly characterIndex: number;

    /**
     * The map ID of the starting position.
     */
    readonly startMapId: number;

    /**
     * The x coordinate of the starting position.
     */
    readonly startX: number;

    /**
     * The y coordinate of the starting position.
     */
    readonly startY: number;

    /**
     * The BGM.
     */
    readonly bgm: AudioFile;
};

export type RPGSystemAttackMotion = {
    /**
     * The type of the motion.
     */
    readonly type: number;

    /**
     * The ID of the weapon image.
     */
    readonly weaponImageId: number;
};

export type RPGSystemTestBattler = {
    /**
     * The actor ID.
     */
    readonly actorId: number;

    /**
     * The level.
     */
    readonly level: number;

    /**
     * The equipment.
     */
    readonly equips: readonly number[];
};

export type RPGSystemTerms = {
    /**
     * The basic status names.
     */
    readonly basic: readonly string[];

    /**
     * The parameter names.
     */
    readonly params: readonly string[];

    /**
     * The command names.
     */
    readonly commands: readonly string[];

    /**
     * The messages.
     */
    readonly messages: Record<string, string>;
};
