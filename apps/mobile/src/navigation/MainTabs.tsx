import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { IssueTrackerScreen } from "../screens/IssueTrackerScreen";
import { InspectionFlow } from "./InspectionFlow";
import { PillTabBar } from "../components/PillTabBar";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "홈" }} />
      <Tab.Screen name="Inspection" component={InspectionFlow} options={{ title: "현장 점검" }} />
      <Tab.Screen name="Reports" component={IssueTrackerScreen} options={{ title: "이슈" }} />
      <Tab.Screen name="Profile" options={{ title: "프로필" }}>
        {() => <PlaceholderScreen title="프로필" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
