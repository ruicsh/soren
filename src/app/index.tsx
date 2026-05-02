import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text } from 'react-native';

export default function Home() {
  return <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>hello, world!</Text>
    </SafeAreaView>
  </SafeAreaProvider>
}


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    backgroundColor: '#61dafb',
    borderColor: '#20232a',
    borderRadius: 6,
    borderWidth: 4,
    color: '#20232a',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 16,
    padding: 12,
    textAlign: 'center',
  },
});
