import 'react-native-gesture-handler'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}><Ionicons name="heart" size={42} color="#ffffff" /></View>
            <View style={styles.brandName}><Text style={styles.brandMy}>My</Text><Text style={styles.brandCare}>Care</Text><Text style={styles.brandPlus}>+</Text></View>
            <Text style={styles.tagline}>CARE. EDUCATE. EMPOWER.</Text>
          </View>
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
  brandLockup: {
    minWidth: 240,
    alignItems: 'center',
    padding: 24,
  },
  brandMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#c94f78',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 6px 14px rgba(201, 79, 120, 0.22)',
    elevation: 4,
  },
  brandName: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  brandMy: {
    color: '#c94f78',
    fontSize: 38,
    fontWeight: '300',
  },
  brandCare: {
    color: '#24312e',
    fontSize: 38,
    fontWeight: '700',
  },
  brandPlus: {
    color: '#c94f78',
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 2,
  },
  tagline: {
    color: '#71807b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 10,
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
