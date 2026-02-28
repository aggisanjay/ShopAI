// Breaks circular dependency between api/index.js and store/index.js
// Usage: import { getStore } from './storeRef.js'
let _store = null;

export const setStore = (store) => { _store = store; };
export const getStore = () => _store;