import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type Props = {
  onSelectRole: (role: 'girl' | 'boy' | 'parent') => void
}

export default function RoleSelection({ onSelectRole }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyCare+</Text>
      <Text style={styles.subtitle}>Choose your role</Text>

      <TouchableOpacity 
        onPress={() => onSelectRole('girl')} 
        style={[styles.roleButton, styles.girlButton]}
      >
        <Text style={styles.roleButtonText}>👩 Girl / Woman</Text>
        <Text style={styles.roleDescription}>Track cycles, order pads, health info</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => onSelectRole('boy')} 
        style={[styles.roleButton, styles.boyButton]}
      >
        <Text style={styles.roleButtonText}>👨 Boy / Man</Text>
        <Text style={styles.roleDescription}>HIV prevention, condoms, health info</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => onSelectRole('parent')} 
        style={[styles.roleButton, styles.parentButton]}
      >
        <Text style={styles.roleButtonText}>👨‍👩‍👧 Parent / Guardian</Text>
        <Text style={styles.roleDescription}>Track children, family supplies</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  roleButton: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  girlButton: {
    backgroundColor: '#fce4ec',
    borderWidth: 1,
    borderColor: '#e91e63',
  },
  boyButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  parentButton: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  roleButtonText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  roleDescription: {
    fontSize: 12,
    color: '#666',
  },
})