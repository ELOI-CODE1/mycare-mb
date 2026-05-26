import React, { useEffect, useState } from 'react'
import { SafeAreaView, StatusBar, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native'
import { supabase } from './src/lib/supabase'
import Login from './src/screens/Login'
import SignUp from './src/screens/SignUp'
import GirlDashboard from './src/screens/GirlDashboard'
import BoyDashboard from './src/screens/BoyDashboard'
import ParentDashboard from './src/screens/ParentDashboard'

type Screen = 'login' | 'signup'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState<Screen>('login')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('Session user ID:', session.user.id)
        
        // Get profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.log('Profile error:', error)
        }
        
        if (profile?.role) {
          console.log('Found role:', profile.role)
          setUserRole(profile.role)
          setIsLoggedIn(true)
        } else {
          console.log('No profile found for user')
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    } catch (err) {
      console.log('Check user error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    checkUser()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserRole(null)
    setCurrentScreen('login')
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    )
  }

  if (!isLoggedIn) {
    if (currentScreen === 'signup') {
      return (
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="dark-content" />
          <SignUp onSignUpComplete={() => setCurrentScreen('login')} />
        </SafeAreaView>
      )
    }
    
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <Login onLogin={handleLogin} />
        <TouchableOpacity 
          style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' }}
          onPress={() => setCurrentScreen('signup')}
        >
          <Text style={{ color: '#e91e63', fontSize: 14 }}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  console.log('Rendering dashboard for role:', userRole)

  if (userRole === 'girl') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <GirlDashboard onLogout={handleLogout} />
      </SafeAreaView>
    )
  }

  if (userRole === 'boy') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <BoyDashboard onLogout={handleLogout} />
      </SafeAreaView>
    )
  }

  if (userRole === 'parent') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <ParentDashboard onLogout={handleLogout} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>No role assigned. Role: {userRole}</Text>
        <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#e91e63', padding: 15, borderRadius: 10 }}>
          <Text style={{ color: '#fff' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}