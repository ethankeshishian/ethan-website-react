import { createStore, compose } from 'redux';

import { rootReducer } from './reducers';

/* Used to make Redux extension compatible with TypeScript */
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default () => {
  let store = createStore(rootReducer, composeEnhancers());
  return { store };
};
