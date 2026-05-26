import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

type Question = {
  id: string
  text: string
  options: { value: string; label: string }[]
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'Who are you?',
    options: [
      { value: 'myself', label: 'I am using this for myself' },
      { value: 'child', label: 'I am a parent/guardian for a child' },
      { value: 'both', label: 'Both for myself and my children' }
    ]
  },
  {
    id: 'q2',
    text: 'What is your gender?',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' }
    ]
  }
]

export default function SignUp({ onSignUpComplete }: { onSignUpComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const determineRole = (answersData: Record<string, string>): string => {
    const q1 = answersData['q1']
    const q2 = answersData['q2']
    
    console.log('Determining role:', { q1, q2 })
    
    if (q1 === 'child' || q1 === 'both') {
      return 'parent'
    }
    
    if (q2 === 'female') {
      return 'girl'
    }
    
    return 'boy'
  }

  const createAccount = async (collectedAnswers: Record<string, string>) => {
    setLoading(true)
    
    const role = determineRole(collectedAnswers)
    
    console.log('Creating account with role:', role)
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: role
        }
      }
    })
    
    if (error) {
      setLoading(false)
      Alert.alert('Error', error.message)
      return
    }
    
    if (data.user) {
      // Save to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
          phone: phone
        })
      
      if (profileError) {
        console.log('Profile insert error:', profileError)
        Alert.alert('Warning', 'Account created but profile save failed. Please contact support.')
      } else {
        console.log('Profile created successfully with role:', role)
      }
    }
    
    setLoading(false)
    Alert.alert('Success', 'Account created! Please login.')
    onSignUpComplete()
  }

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)
    
    console.log('Selected:', questionId, value)
    console.log('All answers:', newAnswers)
    
    // Move to next step
    const nextStep = step + 1
    
    if (nextStep > questions.length) {
      // All questions answered, create account
      createAccount(newAnswers)
    } else {
      setStep(nextStep)
    }
  }

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1)
    } else {
      onSignUpComplete()
    }
  }

  // Step 0: Account info
  if (step === 0) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g., 0788xxxxxx)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            if (!fullName || !email || !password || !phone) {
              Alert.alert('Error', 'Please fill all fields')
              return
            }
            setStep(1)
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // Question screens
  const currentIndex = step - 1
  const currentQuestion = questions[currentIndex]
  
  if (currentQuestion && currentIndex < questions.length) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.questionTitle}>{currentQuestion.text}</Text>
        
        {currentQuestion.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.optionButton}
            onPress={() => handleAnswer(currentQuestion.id, option.value)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // Loading screen while creating account
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creating Account...</Text>
      <Text style={styles.subtitle}>Please wait</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#e91e63',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center'
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center'
  },
  backText: {
    color: '#999',
    fontSize: 16
  }
})