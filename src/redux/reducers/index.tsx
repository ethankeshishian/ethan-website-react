import { combineReducers } from 'redux';
import readyToLoad from './readyToLoad';

export const rootReducer = combineReducers({ readyToLoad });
export type RootState = ReturnType<typeof rootReducer>;
