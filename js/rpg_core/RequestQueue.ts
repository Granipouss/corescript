type Item = {
    isRequestReady: () => boolean;
    startRequest: () => void;
};

type Entry = {
    key: string;
    value: Item;
};

export class RequestQueue<T extends Item> {
    private _queue: Entry[];

    constructor() {
        this._queue = [];
    }

    enqueue(key: string, value: T): void {
        this._queue.push({
            key: key,
            value: value,
        });
    }

    update(): void {
        if (this._queue.length === 0) return;

        const top = this._queue[0];
        if (top.value.isRequestReady()) {
            this._queue.shift();
            if (this._queue.length !== 0) {
                this._queue[0].value.startRequest();
            }
        } else {
            top.value.startRequest();
        }
    }

    raisePriority(key: string): void {
        for (let n = 0; n < this._queue.length; n++) {
            const item = this._queue[n];
            if (item.key === key) {
                this._queue.splice(n, 1);
                this._queue.unshift(item);
                break;
            }
        }
    }

    clear(): void {
        this._queue.splice(0);
    }
}
