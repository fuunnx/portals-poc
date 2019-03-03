export function last<T>(array: T[]): T {
    return array[array.length - 1];
}

export function init<T>(arr: T[]) {
    const len = arr.length;
    return len === 0 ? [] : arr.slice(0, len - 1);
}
