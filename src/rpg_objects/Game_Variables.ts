/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The game object class for variables.
 */
export class Game_Variables {
    private _data: unknown[];

    constructor() {
        this.clear();
    }

    clear(): void {
        this._data = [];
    }

    values(): unknown[] {
        return this._data;
    }

    value(variableId: number): any {
        return this._data[variableId] || 0;
    }

    setValue(variableId: number, value: unknown): void {
        if (variableId > 0 && variableId < window.$dataSystem.variables.length) {
            if (typeof value === 'number') {
                value = Math.floor(value);
            }
            this._data[variableId] = value;
            this.onChange();
        }
    }

    onChange(): void {
        window.$gameMap.requestRefresh();
    }
}
