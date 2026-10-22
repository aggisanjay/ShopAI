import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage();

export const getRequestContext = () => {
  return requestContext.getStore() || {};
};

export const runWithContext = (context, fn) => {
  return requestContext.run(context, fn);
};
