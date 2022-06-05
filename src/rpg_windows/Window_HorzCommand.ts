import { Window_Command } from './Window_Command';

/**
 * The command window for the horizontal selection format.
 * @abstract
 */
export class Window_HorzCommand extends Window_Command {
    numVisibleRows(): number {
        return 1;
    }

    maxCols(): number {
        return 4;
    }

    itemTextAlign(): CanvasTextAlign {
        return 'center';
    }
}
