"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import configureStore from "../../redux/configureStore";

const App = dynamic(() => import("../../App"), { ssr: false });

export function ClientOnly() {
  const ref = useRef<ReturnType<typeof configureStore>>(undefined);
  if (!ref.current) {
    ref.current = configureStore();
  }
  const { store, persistor } = ref.current;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );
}
