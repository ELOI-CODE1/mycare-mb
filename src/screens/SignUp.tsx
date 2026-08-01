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

export const questions = [
  {
    id: 'q1',
    text: 'Who are you registering for?',
    options: [
      { value: 'myself', label: 'For myself' },
      { value: 'child', label: 'For my child / dependent' },
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

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Errors & Loading State
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  // Handle Step 1 Next
  const handleNextStep = () => {
    const { isValid, errors: stepErrors } = validateStepOne({ fullName, email, password, phone })
    setErrors(stepErrors)

    if (isValid) {
      setStep(1)
    }
  }

  // Determine Role
  const determineRole = (ans: Record<string, string>): 'girl' | 'boy' | 'parent' => {
    if (ans['q1'] === 'child') return 'parent'
    if (ans['q2'] === 'female') return 'girl'
    return 'boy'
  }

  // Handle Final Submit
  const handleSignUp = async () => {
    const { isValid, errors: stepErrors } = validateStepTwo(answers)
    setErrors(stepErrors)

    if (!isValid) return

    setLoading(true)
    const assignedRole = determineRole(answers)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          gender: answers['q2'],
          role: assignedRole,
        },
      },
    })

    if (error) {
      setLoading(false)
      Alert.alert('Registration Failed', error.message)
      return
    }

    if (data.user) {
      const profilePayload = {
        id: data.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        gender: answers['q2'],
        role: assignedRole,
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })

      if (profileError) {
        console.warn('Profile DB Error:', profileError.message)
      }

      try {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            gender: answers['q2'],
            role: assignedRole,
          },
        })

        if (metadataError) {
          console.warn('Auth metadata update error:', metadataError.message)
        }
      } catch (metadataException) {
        console.warn('Auth metadata update exception:', metadataException)
      }
    }

    await signOut()
    setLoading(false)
    Alert.alert('Success', 'Account created successfully! Please log in.')
    navigation.navigate('Login')
  }

  // Step 0: User Credentials
  if (step === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title" center style={{ marginBottom: spacing.lg }}>
          Create Account
        </Text>

        <View style={styles.inputGroup}>
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={fullName}
            onChangeText={(val) => {
              setFullName(val)
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }))
            }}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(val) => {
              setEmail(val)
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(val) => {
              setPassword(val)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Input
            label="Phone Number"
            placeholder="0788123456"
            value={phone}
            onChangeText={(val) => {
              setPhone(val)
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
            }}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <Button title="Continue" onPress={handleNextStep} style={{ marginTop: spacing.md }} />
      </ScrollView>
    )
  }

  // Step 1: Questionnaire
  if (step === 1 && !loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="heading" center style={{ marginBottom: spacing.md }}>
          Tell Us About Yourself
        </Text>

        {questions.map((q) => {
          const hasError = q.id === 'q1' ? errors.q1 : errors.q2
          return (
            <View key={q.id} style={styles.questionSection}>
              <Text variant="heading" style={styles.questionText}>
                {q.text}
              </Text>

              {q.options.map((opt) => {
                const isSelected = answers[q.id] === opt.value
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => {
                      setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                      setErrors((prev) => ({ ...prev, [q.id]: undefined }))
                    }}
                  >
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                )
              })}

              {hasError && <Text style={styles.errorText}>{hasError}</Text>}
            </View>
          )
        })}

        <Button title="Complete Registration" onPress={handleSignUp} style={{ marginTop: spacing.lg }} />

        <TouchableOpacity onPress={() => setStep(0)} style={styles.backButton}>
          <Text muted>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <View style={[styles.container, styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="title" center style={{ marginTop: spacing.lg }}>
        Creating Account...
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  inputGroup: { marginBottom: spacing.sm },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  questionSection: { marginBottom: spacing.lg },
  questionText: { marginBottom: spacing.sm, fontWeight: '600' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  optionLabel: { fontSize: 15, fontWeight: '500' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  backButton: { marginTop: spacing.xl, alignItems: 'center' },
})