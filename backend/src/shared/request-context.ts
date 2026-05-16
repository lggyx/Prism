import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  userId: string;
};

const storage = new AsyncLocalStorage<RequestContext>();
const fallbackUserId = "user_01";

export function runWithRequestContext<T>(context: RequestContext, callback: () => T) {
  return storage.run(context, callback);
}

export function getCurrentUserId() {
  return storage.getStore()?.userId ?? fallbackUserId;
}
