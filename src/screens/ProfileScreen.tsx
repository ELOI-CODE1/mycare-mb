import React, { useState } from 'react'
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Text, Card, Input, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { pickAndUploadImage } from '../lib/uploadImage'
import { colors, spacing, radius, roleAccent, roleColors, type Role } from '../theme'

type IconName = keyof typeof Ionicons.glyphMap

function Field({ icon, label, value }: { icon: IconName; label: string; value?: string | null }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={colors.gray500} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text variant="body">{value || '—'}</Text>
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const { profile, role, refreshProfile } = useAuth()
  const accent = roleAccent(role)
  const soft = (role && roleColors[role as Role]?.soft) || colors.gray100
  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const startEditing = () => {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')
    setEditing(true)
  }

  const saveProfile = async () => {
    if (!profile?.id) return
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message || 'Could not update your profile.')
      return
    }
    await refreshProfile()
    setEditing(false)
    Alert.alert('Saved', 'Your profile has been updated.')
  }

  const changePhoto = async () => {
    if (!profile?.id) return
    try {
      setUploadingAvatar(true)
      const url = await pickAndUploadImage('avatars', profile.id)
      if (!url) return
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Could not update your photo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <Screen topInset={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={changePhoto} activeOpacity={0.8} disabled={uploadingAvatar}>
          <View style={[styles.avatar, { backgroundColor: soft }]}>
            {uploadingAvatar ? (
              <ActivityIndicator color={accent} />
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={40} color={accent} />
            )}
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: accent }]}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text variant="title" center>
          {profile?.full_name || 'My Profile'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: soft }]}>
          <Text variant="caption" color={accent} style={{ textTransform: 'capitalize' }}>
            {role || 'user'}
          </Text>
        </View>
      </View>

      {editing ? (
        <Card>
          <Input label="Full name" placeholder="Your name" value={fullName} onChangeText={setFullName} />
          <Input label="Phone" placeholder="Your phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Button title={saving ? 'Saving…' : 'Save changes'} accent={accent} onPress={saveProfile} disabled={saving} />
          <Button title="Cancel" variant="secondary" onPress={() => setEditing(false)} style={{ marginTop: spacing.sm }} />
        </Card>
      ) : (
        <>
          <Card>
            <Field icon="person-outline" label="Full name" value={profile?.full_name} />
            <Divider />
            <Field icon="mail-outline" label="Email" value={profile?.email} />
            <Divider />
            <Field icon="call-outline" label="Phone" value={profile?.phone} />
            <Divider />
            <Field icon="calendar-outline" label="Member since" value={joined} />
          </Card>

          <Button title="Edit profile" accent={accent} onPress={startEditing} style={{ marginTop: spacing.lg }} />
          <Text variant="caption" muted center style={{ marginTop: spacing.md }}>
            Email can't be changed here. To change it, please contact support.
          </Text>
        </>
      )}
    </Screen>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: spacing.md - 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  field: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.xs },
})
