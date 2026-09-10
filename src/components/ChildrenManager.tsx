import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card, EmptyState, Text } from './ui'
import DateField from './DateField'
import { api, apiErrorMessage } from '../api/client'
import { colors, radius, spacing } from '../theme'

type Child = { id: string; fullName: string; birthDate?: string | null; gender?: string | null; notes?: string | null }

export default function ChildrenManager({ accent }: { accent: string }) {
  const [children, setChildren] = useState<Child[] | null>(null)
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ children: Child[] }>('/parent/children')
      setChildren(res.data.children)
    } catch { setChildren([]) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const add = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Add a name', 'Give the child profile a name.')
      return
    }
    if (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      Alert.alert('Check birth date', 'Use YYYY-MM-DD format.')
      return
    }
    setSaving(true)
    try {
      await api.post('/parent/children', { fullName: name.trim(), birthDate: birth || undefined })
      setName('')
      setBirth('')
      load()
    } catch (e) {
      Alert.alert('Could not add profile', apiErrorMessage(e))
    } finally { setSaving(false) }
  }

  const remove = async (child: Child) => {
    Alert.alert('Remove profile?', `Remove ${child.fullName}? Health data separation is preserved — other profiles are untouched.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await api.delete(`/parent/children/${child.id}`); load() } catch (e) { Alert.alert('Could not remove', apiErrorMessage(e)) } } },
    ])
  }

  return (
    <Card>
      <Text variant="caption" color={accent}>FAMILY CARE</Text>
      <Text variant="heading" style={{ marginTop: spacing.xs }}>Child profiles</Text>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Each profile is stored separately — children never see each other's data.</Text>
      {children === null ? (
        <Text variant="caption" muted style={{ marginTop: spacing.md }}>Loading…</Text>
      ) : children.length === 0 ? (
        <View style={{ marginTop: spacing.md }}><EmptyState icon="person-add-outline" title="No child profiles" subtitle="Add your first profile below." /></View>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {children.map((child) => (
            <View key={child.id} style={styles.childRow}>
              <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}><Ionicons name="person-outline" size={18} color={accent} /></View>
              <View style={{ flex: 1 }}>
                <Text variant="label">{child.fullName}</Text>
                <Text variant="caption" muted>{child.birthDate ? new Date(child.birthDate).toLocaleDateString() : 'Birth date not set'}</Text>
              </View>
              <TouchableOpacity accessibilityLabel={`Remove ${child.fullName}`} onPress={() => remove(child)} style={styles.remove}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.form}>
        <TextInput value={name} onChangeText={setName} placeholder="Child's name" placeholderTextColor={colors.gray400} style={styles.input} />
        <DateField label="Birth date (optional)" value={birth} onChange={setBirth} maximumDate={new Date()} />
        <Button title="Add profile" onPress={add} loading={saving} accent={accent} />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100 },
  form: { marginTop: spacing.md, gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.gray100 },
})
