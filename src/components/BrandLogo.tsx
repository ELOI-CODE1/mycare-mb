import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from './ui'
import { colors, spacing } from '../theme'

// Single branding lockup: logo image with the name below it.
// Used on the splash screen and auth headers so branding stays consistent.
export default function BrandLogo({ size = 88, showName = true }: { size?: number; showName?: boolean }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <View style={styles.wrap}>
      {failed ? (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="heart" size={size * 0.45} color="#ffffff" />
        </View>
      ) : (
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../assets/logo.png')}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
      {showName ? (
        <View style={styles.nameRow}>
          <Text style={styles.my}>My</Text>
          <Text style={styles.care}>Care</Text>
          <Text style={styles.plus}>+</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  fallback: { backgroundColor: '#c94f78', justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  my: { color: '#c94f78', fontSize: 30, fontWeight: '300' },
  care: { color: colors.ink, fontSize: 30, fontWeight: '700' },
  plus: { color: '#c94f78', fontSize: 26, fontWeight: '700', marginLeft: 2 },
})
