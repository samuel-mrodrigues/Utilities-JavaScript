/**
 * Resolves after a given number of milliseconds
 */
export function pausePromise(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

