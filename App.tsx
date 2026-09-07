import 'react-native-gesture-handler'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { CartProvider } from './src/context/CartContext'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true)
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
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
        <Animated.View pointerEvents="box-none" style={[styles.splashOverlay, { opacity: fadeAnim }]}> 
          <View style={styles.logoContainer}>
            <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </Animated.View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
})
