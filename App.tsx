import 'react-native-gesture-handler'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
