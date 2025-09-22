import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function WorkerIndex() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Tab [Home|Settings]</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
