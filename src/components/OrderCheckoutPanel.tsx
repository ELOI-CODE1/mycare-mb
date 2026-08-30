import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Card, Input, Text } from './ui'
import { colors, spacing } from '../theme'

export default function OrderCheckoutPanel({ accountPhone = '' }: { accountPhone?: string }) {
  const [contactPhone, setContactPhone] = useState('')
  const submit = () => {
    const phone = contactPhone.trim() || accountPhone.trim()
    if (!phone) {
      Alert.alert('Phone number required', 'Add a contact number so the delivery team can reach you.')
      return
    }
    Alert.alert('Ready for checkout', `The order will use ${phone}. Your API will submit the order here.`)
  }
  return (
    <Card>
      <Text variant="heading">Order contact</Text>
      <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Optional: leave blank to use the phone number from account creation.</Text>
      <Input label="Contact phone for this order" placeholder={accountPhone || '07…'} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      <Button title="Continue to order" onPress={submit} accent={colors.primary} />
    </Card>
  )
}

const styles = StyleSheet.create({})
