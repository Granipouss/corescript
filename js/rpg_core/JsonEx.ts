/* eslint-disable @typescript-eslint/no-explicit-any */

type Circular = [string, any, any];
type Registry = Record<string, any>;

/**
 * The static class that handles JSON with object information.
 */
export const JsonEx = new (class JsonEx {
    /**
     * The maximum depth of objects.
     * @default 100
     */
    maxDepth = 100;

    private _id = 1;
    private _generateId() {
        return this._id++;
    }

    /**
     * Converts an object to a JSON string with object information.
     */
    stringify(object: unknown): string {
        const circular: Circular[] = [];
        this._id = 1;
        const json = JSON.stringify(this._encode(object, circular, 0));
        this._cleanMetadata(object);
        this._restoreCircularReference(circular);

        return json;
    }

    private _restoreCircularReference(circulars: Circular[]): void {
        circulars.forEach((circular) => {
            const key = circular[0];
            const value = circular[1];
            const content = circular[2];

            value[key] = content;
        });
    }

    /**
     * Parses a JSON string and reconstructs the corresponding object.
     */
    parse(json: string): any {
        const circular: Circular[] = [];
        const registry: Registry = {};
        const contents = this._decode(JSON.parse(json), circular, registry);
        this._cleanMetadata(contents);
        this._linkCircularReference(contents, circular, registry);

        return contents;
    }

    private _linkCircularReference(contents: any, circulars: Circular[], registry: Registry): void {
        circulars.forEach((circular) => {
            const key = circular[0];
            const value = circular[1];
            const id = circular[2];

            value[key] = registry[id];
        });
    }

    private _cleanMetadata(object: any): void {
        if (!object) return;

        delete object['@'];
        delete object['@c'];

        if (typeof object === 'object') {
            Object.keys(object).forEach((key) => {
                const value = object[key];
                if (typeof value === 'object') {
                    this._cleanMetadata(value);
                }
            });
        }
    }

    /**
     * Makes a deep copy of the specified object.
     */
    makeDeepCopy<T>(object: T): T {
        return this.parse(this.stringify(object));
    }

    private _encode(value: any, circular: Circular[], depth = 0): object {
        if (++depth >= this.maxDepth) {
            throw new Error('Object too deep');
        }
        const type = Object.prototype.toString.call(value);
        if (type === '[object Object]' || type === '[object Array]') {
            value['@c'] = this._generateId();

            const constructorName = this._getConstructorName(value);
            if (constructorName !== 'Object' && constructorName !== 'Array') {
                value['@'] = constructorName;
            }
            for (const key in value) {
                if ((!value.hasOwnProperty || value.hasOwnProperty(key)) && !key.match(/^@./)) {
                    if (value[key] && typeof value[key] === 'object') {
                        if (value[key]['@c']) {
                            circular.push([key, value, value[key]]);
                            value[key] = { '@r': value[key]['@c'] };
                        } else {
                            value[key] = this._encode(value[key], circular, depth + 1);

                            if (value[key] instanceof Array) {
                                //wrap array
                                circular.push([key, value, value[key]]);

                                value[key] = {
                                    '@c': value[key]['@c'],
                                    '@a': value[key],
                                };
                            }
                        }
                    } else {
                        value[key] = this._encode(value[key], circular, depth + 1);
                    }
                }
            }
        }
        depth--;
        return value;
    }

    private _decode(value: any, circular: Circular[], registry: Registry): any {
        const type = Object.prototype.toString.call(value);
        if (type === '[object Object]' || type === '[object Array]') {
            registry[value['@c']] = value;

            if (value['@'] === null) {
                value = this._resetPrototype(value, null);
            } else if (value['@']) {
                const constructor = window[value['@']] as any;
                if (constructor) {
                    value = this._resetPrototype(value, constructor.prototype);
                }
            }
            for (const key in value) {
                if (!value.hasOwnProperty || value.hasOwnProperty(key)) {
                    if (value[key] && value[key]['@a']) {
                        //object is array wrapper
                        const body = value[key]['@a'];
                        body['@c'] = value[key]['@c'];
                        value[key] = body;
                    }
                    if (value[key] && value[key]['@r']) {
                        //object is reference
                        circular.push([key, value, value[key]['@r']]);
                    }
                    value[key] = this._decode(value[key], circular, registry);
                }
            }
        }
        return value;
    }

    private _getConstructorName(value: any): string {
        if (!value.constructor) {
            return null;
        }
        let name = value.constructor.name;
        if (name === undefined) {
            const func = /^\s*function\s*([A-Za-z0-9_$]*)/;
            name = func.exec(value.constructor)[1];
        }
        return name;
    }

    private _resetPrototype(value: any, prototype: any): any {
        if (Object.setPrototypeOf !== undefined) {
            Object.setPrototypeOf(value, prototype);
        } else if ('__proto__' in value) {
            value.__proto__ = prototype;
        } else {
            const newValue = Object.create(prototype);
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    newValue[key] = value[key];
                }
            }
            value = newValue;
        }
        return value;
    }
})();
