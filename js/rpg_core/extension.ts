/**
 * Returns a number whose value is limited to the given range.
 */
export const clamp = (value: number, [min, max]: [number, number]): number => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Returns a modulo value which is always positive.
 */
export const mod = (value: number, div: number): number => {
    return ((value % div) + div) % div;
};

/**
 * Replaces %1, %2 and so on in the string to the arguments.
 */
export const format = (template: string, ...args: unknown[]): string => {
    return template.replace(/%([0-9]+)/g, (s, n) => String(args[Number(n) - 1]));
};

/**
 * Checks whether the two arrays are same.
 */
export const arrayEquals = (A: readonly unknown[], B: readonly unknown[]): boolean => {
    if (!B || A.length !== B.length) {
        return false;
    }
    for (let i = 0; i < A.length; i++) {
        if (A[i] instanceof Array && B[i] instanceof Array) {
            if (!arrayEquals(A[i] as unknown[], B[i] as unknown[])) {
                return false;
            }
        } else if (A[i] !== B[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Makes a shallow copy of the array.
 */
export const arrayClone = <T extends unknown[]>(list: T): T => {
    return list.slice(0) as T;
};

/**
 * Generates a random integer in the range (0, max-1).
 */
export const randomInt = (max: number): number => {
    return Math.floor(max * Math.random());
};

export type Tone = [number, number, number, number];
