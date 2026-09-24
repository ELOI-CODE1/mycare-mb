import 'react-native-gesture-handler'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Platform, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { CartProvider } from './src/context/CartContext'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'
import BrandLogo from './src/components/BrandLogo'
import { Text } from './src/components/ui'
import { setupNotificationChannel } from './src/utils/notificationService'
import { usePeriodReminderSync } from './src/hooks/usePeriodReminderSync'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const prefix = Linking.createURL('/')
const linking = {
  prefixes: [prefix, 'mycareplus://'],
  config: {
    screens: {
      Login: 'login',
      SignUp: 'signup',
      ResetPassword: {
        path: 'reset',
        parse: { token: (token: string) => token },
      },
      RoleGateway: 'app',
      AdminDashboard: 'admin',
    },
  },
}

function SplashGate({ onReady }: { onReady: () => void }) {
  const { loading } = useAuth()
  useEffect(() => {
    if (!loading) onReady()
  }, [loading, onReady])
  return null
}

function ReminderSync() {
  const { user } = useAuth()
  usePeriodReminderSync(user?.role)
  return null
}

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const hidden = useRef(false)

  const hideSplash = useRef(() => {
    if (hidden.current) return
    hidden.current = true
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setIsSplashVisible(false)
      SplashScreen.hideAsync().catch(() => undefined)
    })
  }).current

  useEffect(() => {
    setupNotificationChannel().catch(() => undefined)
    // Safety: never trap the user behind the splash.
    const timer = setTimeout(() => hideSplash(), 3500)
    return () => clearTimeout(timer)
  }, [hideSplash])

  useEffect(() => {
    if (authReady) {
      const timer = setTimeout(() => hideSplash(), 400)
      return () => clearTimeout(timer)
    }
  }, [authReady, hideSplash])

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <SplashGate onReady={() => setAuthReady(true)} />
            <ReminderSync />
            <CartProvider>
              <NavigationContainer linking={linking}>
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
