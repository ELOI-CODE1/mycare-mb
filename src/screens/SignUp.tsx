import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Text, Input, Button } from '../components/ui'
import { colors, spacing, radius } from '../theme'
import { validateStepOne, validateStepTwo, FormErrors } from '../utils/validation'
import type { RootStackParamList } from '../navigation/RootNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>

type Question = {
  id: string
  text: string
  options: { value: string; label: string }[]
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'How will you be using HerCare+',
    options: [
      { value: 'myself', label: 'For my own health tracking' },
      { value: 'child', label: 'As a parent/guardian managing my chidren' },
    ],
  },
  {
    id: 'q2',
    text: 'What is your gender?',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
    ],
  },
]

export default function SignUp({ navigation }: Props) {
  const { signOut } = useAuth()
  const [step, setStep] = useState(0)
   
  //form state
  const [email, setEmail] = useState('') 
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  //Errors & Loading state
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  //Handle step 1
  const handleNextStep = () => {
    const { isValid, errors: stepErrors } = validateStepOne({fullName, email, password, phone})
    setErrors(stepErrors)

    if (isValid){
      setStep(1)
    }
  }

  //Determine role
  const determineRole = (answers: Record<string, string>): 'girl' | 'boy' | 'parent'=> {
    if (answers['q1'] === 'child') return 'parent'
    if (answers['q2'] === 'female') return 'girl'
    return 'boy'
  }

  const handleSignup = async () => {
    const { isValid, errors: stepErrors } = validateStepTwo(answers)
    setErrors(stepErrors)

    if (!isValid) return

    setLoading(true)
    const assignedRole = determineRole(answers)
    
    const { data, error} = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          gender:answers['q2'],
          role: assignedRole,
          
        },
      },
    });

    if(error){
      setLoading(false)
      Alert.alert('Registration Failed', error.message)
      return
    }

    if (data.user) {
      const {error: profileError} = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        gender: answers['q2'],
        role: assignedRole

      })

      if (profileError) {
        console.warn('Profile DB Error:', profileError.message)
      }
    }

    await signOut()
    setLoading(false)
    Alert.alert('Success', 'Account created successfully! Please log in.')
    navigation.navigate('Login')
  }

  //step 0. user credentials
  if (step === 0){
    return(
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant='title' center style={{ marginBottom: spacing.lg}}>
          Create Account
        </Text>
        <View style={styles.inputGroup}>
          <Input
          label='Full Name'
          placeholder='Jane Doe'
          value={fullName}
          onChangeText={(val) => {
            setFullName(val)
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined}))
          }}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Input
          label='Email'
          placeholder='you@example.com'
          value={email}
          onChangeText={(val) => {
            setEmail(val)
            if (errors.email) setErrors((prev) => ({...prev, email: undefined}))
          }}
          autoCapitalize='none'
          keyboardType='email-address'
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Input 
          label='Password'
          placeholder='........'
          value={password}
          onChangeText={(val) => {
            setPassword(val)
            if (errors.password) setErrors((prev) =>({ ...prev, password: undefined}))
          }}
          secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>} 
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Phone Number"
            placeholder="07xxxxxxxx"
            value={phone}
            onChangeText={(val) => {
              setPhone(val)
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
            }}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <Button title='Continue' onPress={handleNextStep} style={{marginTop: spacing.md}}/>
      </ScrollView>
    )
  }
  //step 1. Quetionaire
    
}

const styles = StyleSheet.create({

})
