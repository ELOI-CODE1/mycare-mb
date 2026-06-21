import React, { useEffect, useMemo, useState } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Text, Card, Input, Button, Badge, EmptyState } from '../ui'
import OrderCard from '../OrderCard'
import { colors, spacing, radius, roleColors } from '../../theme'

const ACCENT = roleColors.admin.accent
const SOFT = roleColors.admin.soft

type Profile = {
  id: string
  email: string
  full_name: string
  role: string
  phone: string
  status?: string
  created_at: string
}

type Order = { id: number; product_name: string; quantity: number; total_price: number; status: string; created_at: string }

const ROLE_FILTERS = ['all', 'girl', 'boy', 'parent', 'admin'] as const
const ASSIGNABLE_ROLES = ['girl', 'boy', 'parent', 'admin'] as const

function statusBadge(status?: string) {
  switch (status) {
    case 'suspended':
      return { label: 'Suspended', bg: '#fff4e0', fg: '#b26a00' }
    case 'deleted':
      return { label: 'Deleted', bg: colors.gray100, fg: colors.gray500 }
    default:
      return { label: 'Active', bg: colors.greenSoft, fg: colors.success }
  }
}

export default function AdminUsers() {
  const { user } = useAuth()
  const currentUserId = user?.id

  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>('all')
  const [showDeleted, setShowDeleted] = useState(false)

  const [selected, setSelected] = useState<Profile | null>(null)
  const [actionsVisible, setActionsVisible] = useState(false)
  const [ordersVisible, setOrdersVisible] = useState(false)
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) console.error('Error loading users:', error)
    else setUsers((data as Profile[]) || [])
  }

  const logAudit = async (action: string, targetUserId: string, detail?: any) => {
    // Best-effort; ignore failures (table/policy may not exist yet).
    await supabase
      .from('admin_audit_log')
      .insert({ admin_id: currentUserId, action, target_user_id: targetUserId, detail })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (!showDeleted && u.status === 'deleted') return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (q && !(`${u.full_name} ${u.email}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [users, search, roleFilter, showDeleted])

  const openActions = (u: Profile) => {
    setSelected(u)
    setActionsVisible(true)
  }

  const isSelf = selected?.id === currentUserId

  const changeRole = async (newRole: string) => {
    if (!selected) return
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', selected.id)
    setBusy(false)
    if (error) return Alert.alert('Error', error.message)
    await logAudit('change_role', selected.id, { from: selected.role, to: newRole })
    setSelected({ ...selected, role: newRole })
    loadUsers()
    Alert.alert('Updated', `Role changed to "${newRole}".`)
  }

  const setStatus = async (status: 'active' | 'suspended' | 'deleted', verb: string) => {
    if (!selected) return
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ status }).eq('id', selected.id)
    setBusy(false)
    if (error) return Alert.alert('Error', error.message)
    await logAudit(verb, selected.id, { status })
    setSelected({ ...selected, status })
    loadUsers()
    if (status === 'deleted') setActionsVisible(false)
  }

  const resetPassword = async () => {
    if (!selected?.email) return
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(selected.email)
    setBusy(false)
    await logAudit('reset_password', selected.id)
    Alert.alert(error ? 'Error' : 'Email sent', error ? error.message : `Reset link sent to ${selected.email}.`)
  }

  const viewOrders = async () => {
    if (!selected) return
    setActionsVisible(false)
    const { data } = await supabase
      .from('orders')
      .select('*, products(name)')
      .eq('user_id', selected.id)
      .order('created_at', { ascending: false })
    setUserOrders((data || []).map((o: any) => ({ ...o, product_name: o.products?.name || 'Unknown' })))
    setOrdersVisible(true)
  }

  const confirmDelete = () => {
    if (!selected) return
    Alert.alert('Delete user', `Soft-delete ${selected.full_name || selected.email}? Their order history is kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setStatus('deleted', 'soft_delete') },
    ])
  }

  return (
    <View>
      {/* Search */}
      <Input
        placeholder="Search by name or email"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {/* Role filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {ROLE_FILTERS.map((r) => {
          const active = roleFilter === r
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRoleFilter(r)}
              style={[styles.chip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text variant="caption" color={active ? colors.white : colors.gray700} style={{ textTransform: 'capitalize' }}>
                {r}
              </Text>
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity
          onPress={() => setShowDeleted((s) => !s)}
          style={[styles.chip, showDeleted && { backgroundColor: colors.gray500, borderColor: colors.gray500 }]}
        >
          <Text variant="caption" color={showDeleted ? colors.white : colors.gray700}>
            Deleted
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* User list */}
      {filtered.length === 0 ? (
        <EmptyState icon="people-outline" title="No users found" />
      ) : (
        filtered.map((u) => {
          const sb = statusBadge(u.status)
          return (
            <Card key={u.id}>
              <View style={styles.rowBetween}>
                <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                  {u.full_name || 'Unnamed'}
                </Text>
                <Badge label={u.role} bg={SOFT} fg={ACCENT} />
              </View>
              <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
                {u.email}
              </Text>
              <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
                <Badge label={sb.label} bg={sb.bg} fg={sb.fg} />
                <Button title="Manage" accent={ACCENT} fullWidth={false} onPress={() => openActions(u)} style={styles.manageBtn} />
              </View>
            </Card>
          )
        })
      )}

      {/* Actions modal */}
      <Modal visible={actionsVisible} animationType="slide" transparent onRequestClose={() => setActionsVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {selected && (
              <ScrollView>
                <Text variant="heading">{selected.full_name || 'User'}</Text>
                <Text variant="caption" muted>{selected.email}</Text>

                {isSelf && (
                  <Text variant="caption" color={colors.warning} style={{ marginTop: spacing.sm }}>
                    This is your own account — destructive actions are disabled.
                  </Text>
                )}

                {/* Change role */}
                <Text variant="label" style={styles.sectionLabel}>Change role</Text>
                <View style={styles.roleRow}>
                  {ASSIGNABLE_ROLES.map((r) => {
                    const active = selected.role === r
                    return (
                      <TouchableOpacity
                        key={r}
                        disabled={busy}
                        onPress={() => changeRole(r)}
                        style={[styles.chip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                      >
                        <Text variant="caption" color={active ? colors.white : colors.gray700} style={{ textTransform: 'capitalize' }}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                {/* Actions */}
                <Text variant="label" style={styles.sectionLabel}>Actions</Text>
                <Button title="View order history" variant="secondary" onPress={viewOrders} style={styles.actionBtn} />
                <Button title="Send password reset" variant="secondary" onPress={resetPassword} loading={busy} style={styles.actionBtn} />

                {!isSelf && selected.status === 'suspended' ? (
                  <Button title="Reactivate account" accent={colors.success} onPress={() => setStatus('active', 'reactivate')} loading={busy} style={styles.actionBtn} />
                ) : !isSelf ? (
                  <Button title="Suspend account" accent={colors.warning} onPress={() => setStatus('suspended', 'suspend')} loading={busy} style={styles.actionBtn} />
                ) : null}

                {!isSelf && (
                  <Button title="Delete user" variant="danger" onPress={confirmDelete} style={styles.actionBtn} />
                )}

                <TouchableOpacity onPress={() => setActionsVisible(false)} style={styles.closeBtn}>
                  <Text muted>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Order history modal */}
      <Modal visible={ordersVisible} animationType="slide" transparent onRequestClose={() => setOrdersVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '80%' }]}>
            <View style={styles.handle} />
            <View style={styles.rowBetween}>
              <Text variant="heading">Order history</Text>
              <TouchableOpacity onPress={() => setOrdersVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>
            <Text variant="caption" muted style={{ marginBottom: spacing.md }}>
              {selected?.full_name || selected?.email}
            </Text>
            <ScrollView>
              {userOrders.length === 0 ? (
                <EmptyState icon="receipt-outline" title="No orders" />
              ) : (
                userOrders.map((o) => (
                  <OrderCard
                    key={o.id}
                    productName={o.product_name}
                    quantity={o.quantity}
                    total={o.total_price}
                    status={o.status}
                    date={o.created_at}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manageBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray200, alignSelf: 'center', marginBottom: spacing.lg },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actionBtn: { marginBottom: spacing.sm },
  closeBtn: { marginTop: spacing.md, alignItems: 'center' },
})
