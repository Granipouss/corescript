import * as PIXI from 'pixi.js';

/**
 * The root object of the display tree.
 */
export class Stage extends PIXI.Container {
    constructor() {
        super();

        // The interactive flag causes a memory leak.
        this.interactive = false;
    }

    /**
     * [read-only] The array of children of the stage.
     *
     * @property children
     * @type Array
     */

    /**
     * Adds a child to the container.
     *
     * @method addChild
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */

    /**
     * Adds a child to the container at a specified index.
     *
     * @method addChildAt
     * @param {Object} child The child to add
     * @param {Number} index The index to place the child in
     * @return {Object} The child that was added
     */

    /**
     * Removes a child from the container.
     *
     * @method removeChild
     * @param {Object} child The child to remove
     * @return {Object} The child that was removed
     */

    /**
     * Removes a child from the specified index position.
     *
     * @method removeChildAt
     * @param {Number} index The index to get the child from
     * @return {Object} The child that was removed
     */
}
