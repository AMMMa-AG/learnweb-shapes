/*
 * $Id: globals.d.ts 42743 2017-08-18 11:17:52Z robertj $
 *
 * TypeScript definitions for the sake of making Visual Code's embedded
 * TypeScript-based ES6 Lint tool happier than ever.
 */


/**
 * Array extensions.
 */
interface Array<T> {
  min<U>(callbackfn?: (this: void, value: T, index: number, array: T[]) => U): U;
  max<U>(callbackfn?: (this: void, value: T, index: number, array: T[]) => U): U;
}
