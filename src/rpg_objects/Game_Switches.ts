/**
 * The game object class for switches.
 */
export class Game_Switches {
    private _data: boolean[];

    constructor() {
        this.clear();
    }

    clear(): void {
        this._data = [];
    }

    value(switchId: number): boolean {
        return !!this._data[switchId];
    }

    setValue(switchId: number, value: boolean): void {
        if (switchId > 0 && switchId < window.$dataSystem.switches.length) {
            this._data[switchId] = value;
            this.onChange();
        }
    }

    onChange(): void {
        window.$gameMap.requestRefresh();
    }
}
