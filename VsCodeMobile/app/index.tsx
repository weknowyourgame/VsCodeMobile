import { StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
	if (Platform.OS === 'web') {
		return (
			<iframe
				src="http://localhost:8080"
				style={{ height: '100%', width: '100%', border: 'none' }}
				title="VS Code Web"
			/>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<WebView
				source={{ uri: 'http://localhost:8080' }}
				style={styles.webview}
				javaScriptEnabled={true}
				domStorageEnabled={true}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	webview: {
		flex: 1,
	},
});
