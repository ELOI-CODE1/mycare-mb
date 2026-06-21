import React from 'react'
import { View, Modal, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../ui'
import { useAuth } from '../../context/AuthContext'
import UserMessageThread from './UserMessageThread'
import AdminMessageInbox from './AdminMessageInbox'
import { colors, spacing, radius } from '../../theme'

export default function MessagesModal({ visible, onClose, accent }: { visible: boolean; onClose: () => void; accent: string }) {
  const insets = useSafeAreaInsets()
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.header}>
            <View>
              <Text variant="title">{isAdmin ? 'Messages' : 'Support'}</Text>
              <Text variant="caption" muted>{isAdmin ? 'Customer messages' : 'Chat with our team'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={26} color={colors.gray700} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {isAdmin ? <AdminMessageInbox accent={accent} /> : <UserMessageThread accent={accent} />}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    flex: 1,
    marginTop: 50,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
})
