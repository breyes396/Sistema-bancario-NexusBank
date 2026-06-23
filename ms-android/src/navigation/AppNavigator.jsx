import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../features/home/screens/HomeScreen";
import DepositScreen from "../features/deposits/screens/DepositScreen";
import DepositSuccessScreen from "../features/deposits/screens/DepositSuccessScreen";
import TransactionsScreen from "../features/transactions/screens/TransactionsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Deposit" component={DepositScreen} />
                <Stack.Screen name="DepositSuccess" component={DepositSuccessScreen} />
                <Stack.Screen name="Transactions" component={TransactionsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
