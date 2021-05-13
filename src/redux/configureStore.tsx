import { createStore } from 'redux';

import { rootReducer } from './reducers';

export default () => {
  let store = createStore(rootReducer);
  return { store };
};
