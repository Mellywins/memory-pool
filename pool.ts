export interface Attachable<T> {
    attach(item?: T): void;
    detach(): void;
}
export class Pool<T> {
    private insertIndex = 0;
    private removalIndex = 0;
    private buffer: T[];

    /*
        * @param {number} size
        * @param {() => T} factory - a function that returns a new instance of T
    */
    constructor(initialCapacity: number, private factory: () => T) {
        this.buffer = new Array(initialCapacity);
    }

    /*
        * @returns length of Pool
    */
    capacity(): number {
        return this.buffer.length;
    }

    fromCache(): T {
        if (this.insertIndex === this.removalIndex) {
            const out: T = this.factory();
            return out;
        }

        const out = this.buffer[this.removalIndex];
        this.removalIndex = (this.removalIndex + 1) % this.buffer.length;

        return out;
    }

    toCache(item: T) {

        this.buffer[this.insertIndex] = item;
        this.insertIndex = (this.insertIndex + 1) % this.buffer.length;

        // we are full
        if (this.insertIndex === this.removalIndex) {
            const nextBuffer = new Array(this.buffer.length * 2);
            for (let i = 0; i < this.buffer.length; i++) {
                nextBuffer[i] = this.buffer[i];
            }
            this.removalIndex = 0;
            this.insertIndex = this.buffer.length; // at the end of the list
            this.buffer = nextBuffer;
        }
    }
}

function createArray() {
    return [];
}

export class ArrayPool<T> extends Pool<T[]> {
    constructor(initialCapacity: number) {
        super(initialCapacity, createArray);
    }

    create(): T[] {
        const out = this.fromCache();
        out.length = 0;

        return out;
    }

    release(arr: T[]) {
        this.toCache(arr);
    }

    seed(count: number): void {
        let backIn = [];
        for (let i = 0; i < count; i++) {
            backIn.push(this.fromCache());
        }

        for (let i = 0; i < count; i++) {
            this.toCache(backIn[i]);
        }
    }
}

export default class AttachablePool<E, T extends Attachable<E>> extends Pool<T> {

    constructor(initialCapacity: number, factory: () => T) {
        super(initialCapacity, factory);
    }

    pop(item?: E): T {
        const out = super.fromCache();
        out.attach(item);
        return out;
    }

    push(item: T) {
        item.detach();
        super.toCache(item);
    }
}