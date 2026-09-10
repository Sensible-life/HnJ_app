import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { LoginScreen } from "../screens/LoginScreen";
import { MainTabs } from "./MainTabs";

export function RootNavigator() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      {loggedIn ? <MainTabs /> : <LoginScreen onLogin={() => setLoggedIn(true)} />}
    </NavigationContainer>
  );
}
