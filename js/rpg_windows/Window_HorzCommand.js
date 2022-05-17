import { Window_Command } from './Window_Command';

/**
 * The command window for the horizontal selection format.
 * @abstract
 */
export class Window_HorzCommand extends Window_Command {
    numVisibleRows() {
        return 1;
    }

    maxCols() {
        return 4;
    }

    itemTextAlign() {
        return 'center';
    }
}
