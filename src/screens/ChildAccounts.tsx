import React, { useEffect, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuth, type Profile } from '../context/AuthContext'
import { Screen, Text, Card, EmptyState } from '../components/ui'
import { colors, spacing, roleAccent } from '../theme'

export default function ChildAccounts() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const [children, setChildren] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const loadChildren = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, parent_id')
        .eq('parent_id', user.id)
        .eq('role', 'girl')

      if (error) {
        console.warn('Failed to load child accounts:', error.message)
        setChildren([])
      } else {
        setChildren((data as Profile[]) || [])
      }
      setLoading(false)
    }

    loadChildren()
  }, [user?.id])

  const accent = roleAccent('parent')

  return (
    <Screen scroll background={colors.background}>
      <Text variant="title" style={styles.title}>Managed child accounts</Text>
      <Text muted style={styles.subtitle}>
        Access the girl account you manage and view her dashboard here.
      </Text>

      {loading ? (
        <EmptyState icon="hourglass-outline" title="Loading child accounts" subtitle="Please wait while we load your managed girls." />
      ) : children.length === 0 ? (
        <EmptyState
          icon="person-add-outline"
          title="No managed girl accounts"
          subtitle="If you already manage a girl account, make sure the profile has your parent account linked."
        />
      ) : (
        children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={styles.childCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ManagedGirlDashboard', { childProfile: child })}
          >
            <Card style={styles.card}>
              <View style={styles.childRow}>
                <View>
                  <Text variant="heading">{child.full_name}</Text>
                  <Text variant="caption" muted>{child.email}</Text>
                </View>
                <Text variant="label" color={accent}>Open</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg, marginBottom: spacing.xs, paddingHorizontal: spacing.lg },
  subtitle: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg, lineHeight: 22 },
  childCard: { marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  card: { backgroundColor: colors.surface },
  childRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
})
