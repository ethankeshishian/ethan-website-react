import { createStore, compose } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import { rootReducer } from './reducers';

/* Used to make Redux extension compatible with TypeScript */
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}
const composeEnhancers =
  (typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const persistConfig = {
  key: 'root',
  blacklist: ['readyToLoad'],
  storage,
};

// redux-persist@6's persistReducer types don't line up with redux@5's stricter
// Reducer type once a key is blacklisted; the runtime behaviour is correct.
const persistedReducer = persistReducer(
  persistConfig,
  rootReducer as any
);

export default () => {
  let store = createStore(persistedReducer, composeEnhancers());
  let persistor = persistStore(store);
  return { store, persistor };
};
