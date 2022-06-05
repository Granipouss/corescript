/**
 * The game object class for self switches.
 */
export class Game_SelfSwitches {
    private _data: Record<string, boolean>;

    constructor() {
        this.clear();
    }

    clear(): void {
        this._data = {};
    }

    value(key: Key): boolean {
        return !!this._data[String(key)];
    }

    setValue(key: Key, value: boolean): void {
        if (value) {
            this._data[String(key)] = true;
        } else {
            delete this._data[String(key)];
        }
        this.onChange();
    }

    onChange(): void {
        window.$gameMap.requestRefresh();
    }
}

type Key = readonly [
    number, // mapId,
    number, // eventId,
    string // selfSwitchCh
];
