"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import configureStore from "../redux/configureStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const ref = useRef<ReturnType<typeof configureStore>>(undefined);
  if (!ref.current) {
    ref.current = configureStore();
  }
  const { store, persistor } = ref.current;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
