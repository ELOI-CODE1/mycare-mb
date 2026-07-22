import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Text, Input, Button } from '../components/ui'
import { colors, spacing, radius } from '../theme'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const determineRole = (answers: Record<string, string>): string => {
    if (answers['q1'] === 'child') return 'parent'
    if (answers['q2'] === 'female') return 'girl'
    return 'boy'
  }

  const createAccount = async (collectedAnswers: Record<string, string>) => {
    setLoading(true)
    const role = determineRole(collectedAnswers)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName, phone, role } },
    })

    if (error) {
      setLoading(false)
      setStep(0)
      Alert.alert('Error', error.message)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName,
        role,
        phone,
      })
      if (profileError) {
        console.warn('Profile insert error:', profileError.message)
      }
    }

    // Sign out so the user logs in explicitly (and the profile is guaranteed
    // to exist before the role-based dashboard loads).
    await signOut()
    setLoading(false)
    Alert.alert('Success', 'Account created! Please login.')
    navigation.navigate('Login')
  }

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)
    const nextStep = step + 1
    if (nextStep > questions.length) {
      createAccount(newAnswers)
    } else {
      setStep(nextStep)
    }
  }

  const goBack = () => {
    if (step > 0) setStep(step - 1)
    else navigation.goBack()
  }

  // Step 0: account details
  if (step === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title" center style={{ marginBottom: spacing.xl }}>
          Create Account
        </Text>

        <Input label="Full Name" placeholder="Jane Doe" value={fullName} onChangeText={setFullName} />
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
        <Input
          label="Phone Number"
          placeholder="0788xxxxxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Button
          title="Continue"
          onPress={() => {
            if (!fullName || !email || !password || !phone) {
              Alert.alert('Error', 'Please fill all fields')
              return
            }
            setStep(1)
          }}
        />
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text muted>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const currentQuestion = questions[step - 1]

  if (currentQuestion) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="heading" center style={{ marginBottom: spacing.xl }}>
          {currentQuestion.text}
        </Text>

        {currentQuestion.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.optionButton}
            onPress={() => handleAnswer(currentQuestion.id, option.value)}
          >
            <Text center>{option.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text muted>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // Creating-account state
  return (
    <View style={[styles.container, styles.content, { justifyContent: 'center' }]}>
      <Text variant="title" center>
        Creating Account...
      </Text>
      <Text muted center>
        Please wait
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  optionButton: {
    backgroundColor: colors.gray100,
    padding: spacing.xl,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButton: { marginTop: spacing.xl, alignItems: 'center' },
})
