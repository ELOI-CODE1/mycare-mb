import 'react-native-gesture-handler'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { CartProvider } from './src/context/CartContext'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'
import BrandLogo from './src/components/BrandLogo'
import { Text } from './src/components/ui'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true)
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setIsSplashVisible(false)
        SplashScreen.hideAsync().catch(() => undefined)
      })
    }, 1400)

    return () => clearTimeout(timer)
  }, [fadeAnim])

  return (
    <>
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

      {isSplashVisible ? (
        <Animated.View style={[styles.splashOverlay, { opacity: fadeAnim, pointerEvents: 'box-none' }]}>
          <BrandLogo size={96} showName />
          <Text style={styles.tagline}>CARE. EDUCATE. EMPOWER.</Text>
        </Animated.View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f4f6f3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  tagline: {
    color: '#71807b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 10,
  },
})
