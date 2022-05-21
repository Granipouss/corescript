import type { Actor } from './rpg_data/actor';
import type { Armor } from './rpg_data/armor';
import type { Class } from './rpg_data/class';
import type { CommonEvent } from './rpg_data/common-event';
import type { Enemy } from './rpg_data/enemy';
import type { Item } from './rpg_data/item';
import type { Map } from './rpg_data/map';
import type { MapInfo } from './rpg_data/map-info';
import type { Skill } from './rpg_data/skill';
import type { State } from './rpg_data/state';
import type { System } from './rpg_data/system';
import type { Tileset } from './rpg_data/tileset';
import type { Troop } from './rpg_data/troop';
import type { Weapon } from './rpg_data/weapon';

import type { Game_Actors } from './rpg_objects/Game_Actors';
import type { Game_Map } from './rpg_objects/Game_Map';
import type { Game_Message } from './rpg_objects/Game_Message';
import type { Game_Party } from './rpg_objects/Game_Party';
import type { Game_Player } from './rpg_objects/Game_Player';
import type { Game_Screen } from './rpg_objects/Game_Screen';
import type { Game_SelfSwitches } from './rpg_objects/Game_SelfSwitches';
import type { Game_Switches } from './rpg_objects/Game_Switches';
import type { Game_System } from './rpg_objects/Game_System';
import type { Game_Temp } from './rpg_objects/Game_Temp';
import type { Game_Timer } from './rpg_objects/Game_Timer';
import type { Game_Troop } from './rpg_objects/Game_Troop';
import type { Game_Variables } from './rpg_objects/Game_Variables';

declare global {
    interface Window {
        $dataActors: Actor[];
        $dataClasses: Class[];
        $dataSkills: Skill[];
        $dataItems: Item[];
        $dataWeapons: Weapon[];
        $dataArmors: Armor[];
        $dataEnemies: Enemy[];
        $dataTroops: Troop[];
        $dataStates: State[];
        $dataAnimations: Animation[];
        $dataTilesets: Tileset[];
        $dataCommonEvents: CommonEvent[];
        $dataSystem: System;
        $dataMapInfos: MapInfo[];
        $dataMap: Map;

        $gameTemp: Game_Temp;
        $gameSystem: Game_System;
        $gameScreen: Game_Screen;
        $gameTimer: Game_Timer;
        $gameMessage: Game_Message;
        $gameSwitches: Game_Switches;
        $gameVariables: Game_Variables;
        $gameSelfSwitches: Game_SelfSwitches;
        $gameActors: Game_Actors;
        $gameParty: Game_Party;
        $gameTroop: Game_Troop;
        $gameMap: Game_Map;
        $gamePlayer: Game_Player;

        $testEvent: string;
    }
}
