const initialState = {
  darkMode: false,
};
const colorTheme = (state = initialState, action: { type: string }) => {
  switch (action.type) {
    case 'TOGGLE_DARK_MODE': {
      return {
        ...state,
        darkMode: !state.darkMode,
      };
    }
    default: {
      return state;
    }
  }
};

export default colorTheme;
