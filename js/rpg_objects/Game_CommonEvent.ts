import { RPGCommonEvent } from '../rpg_data/common-event';
import { RPGEventCommand } from '../rpg_data/event-command';
import { Game_Interpreter } from './Game_Interpreter';

/**
 * The game object class for a common event. It contains functionality for
 * running parallel process events.
 */
export class Game_CommonEvent {
    private _commonEventId: number;
    private _interpreter: Game_Interpreter;

    constructor(commonEventId: number) {
        this._commonEventId = commonEventId;
        this.refresh();
    }

    event(): RPGCommonEvent {
        return window.$dataCommonEvents[this._commonEventId];
    }

    list(): readonly RPGEventCommand[] {
        return this.event().list;
    }

    refresh(): void {
        if (this.isActive()) {
            if (!this._interpreter) {
                this._interpreter = new Game_Interpreter();
            }
        } else {
            this._interpreter = null;
        }
    }

    isActive(): boolean {
        const event = this.event();
        return event.trigger === 2 && window.$gameSwitches.value(event.switchId);
    }

    update(): void {
        if (this._interpreter) {
            if (!this._interpreter.isRunning()) {
                this._interpreter.setup(this.list());
                this._interpreter.setEventInfo({
                    eventType: 'common_event',
                    commonEventId: this._commonEventId,
                });
            }
            this._interpreter.update();
        }
    }
}
