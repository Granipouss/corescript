/**
 * The static class that handles JSON with object information.
 */
export const JsonEx = new (class JsonEx {
    /**
     * The maximum depth of objects.
     *
     * @type Number
     * @default 100
     */
    maxDepth = 100;

    _id = 1;
    _generateId() {
        return this._id++;
    }

    /**
     * Converts an object to a JSON string with object information.
     *
     * @param {Object} object The object to be converted
     * @return {String} The JSON string
     */
    stringify(object) {
        const circular = [];
        this._id = 1;
        const json = JSON.stringify(this._encode(object, circular, 0));
        this._cleanMetadata(object);
        this._restoreCircularReference(circular);

        return json;
    }

    _restoreCircularReference(circulars) {
        circulars.forEach((circular) => {
            const key = circular[0];
            const value = circular[1];
            const content = circular[2];

            value[key] = content;
        });
    }

    /**
     * Parses a JSON string and reconstructs the corresponding object.
     *
     * @param {String} json The JSON string
     * @return {any} The reconstructed object
     */
    parse(json) {
        const circular = [];
        const registry = {};
        const contents = this._decode(JSON.parse(json), circular, registry);
        this._cleanMetadata(contents);
        this._linkCircularReference(contents, circular, registry);

        return contents;
    }

    _linkCircularReference(contents, circulars, registry) {
        circulars.forEach((circular) => {
            const key = circular[0];
            const value = circular[1];
            const id = circular[2];

            value[key] = registry[id];
        });
    }

    _cleanMetadata(object) {
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
     *
     * @param {Object} object The object to be copied
     * @return {Object} The copied object
     */
    makeDeepCopy(object) {
        return this.parse(this.stringify(object));
    }

    /**
     * @param {Object} value
     * @param {Array} circular
     * @param {Number} depth
     * @return {Object}
     * @private
     */
    _encode(value, circular, depth) {
        depth = depth || 0;
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

    /**
     * @param {Object} value
     * @param {Array} circular
     * @param {Object} registry
     * @return {Object}
     * @private
     */
    _decode(value, circular, registry) {
        const type = Object.prototype.toString.call(value);
        if (type === '[object Object]' || type === '[object Array]') {
            registry[value['@c']] = value;

            if (value['@'] === null) {
                value = this._resetPrototype(value, null);
            } else if (value['@']) {
                const constructor = window[value['@']];
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

    /**
     * @param {Object} value
     * @return {String}
     * @private
     */
    _getConstructorName(value) {
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

    /**
     * @param {Object} value
     * @param {Object} prototype
     * @return {Object}
     * @private
     */
    _resetPrototype(value, prototype) {
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
