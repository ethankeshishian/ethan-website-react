import { combineReducers } from 'redux';
import readyToLoad from './readyToLoad';
import colorTheme from './colorTheme';

export const rootReducer = combineReducers({ readyToLoad, colorTheme });
export type RootState = ReturnType<typeof rootReducer>;
