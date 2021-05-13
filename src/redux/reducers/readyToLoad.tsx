const initialState = {
  imageLoaded: false,
};
const readyToLoad = (
  state = initialState,
  action: { type: string; payload: boolean } // might have to update in the future
) => {
  switch (action.type) {
    case 'EDIT_IMAGE_LOADED': {
      return {
        ...state,
        imageLoaded: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default readyToLoad;
