import { StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

export default function App() {
	// Get the Metro bundler URL for all platforms
	const debuggerHost = Constants.expoConfig?.hostUri;
	let localhost = 'localhost';
	const port = '8081'; // Metro bundler always runs on 8081

	if (Platform.OS === 'web') {
		// For web, try to use the same hostname as the current page
		// but fall back to localhost if we can't determine it
		if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
			// If we're accessing via network (e.g., 192.168.x.x), use that hostname
			localhost = window.location.hostname;
		} else {
			// Otherwise use localhost
			localhost = 'localhost';
		}
	} else {
		// For mobile, use the debugger host from Expo
		localhost = debuggerHost?.split(':')[0] || 'localhost';
	}

	// Construct the URL to load index.html through Metro
	// Metro will serve it via our custom middleware
	const uri = `http://${localhost}:${port}/vscode-web/index.html`;

	console.log('Loading VS Code Web from:', uri);

	// For web platform, use iframe
	if (Platform.OS === 'web') {
		return (
			<div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, position: 'relative' }}>
				<iframe
					src={uri}
					style={{ height: '100%', width: '100%', border: 'none' }}
					title="VS Code Web"
					allow="fullscreen"
					onError={(e) => {
						console.error('Iframe error:', e);
					}}
					onLoad={(e) => {
						console.log('Iframe loaded:', uri);
					}}
				/>
				{/* Fallback error message */}
				<div
					id="iframe-error"
					style={{
						display: 'none',
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						color: '#f48771',
						fontFamily: 'monospace',
						textAlign: 'center',
						padding: '20px',
					}}
				>
					<div>Failed to load VS Code Web</div>
					<div style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
						Make sure Metro bundler is running on port 8081
					</div>
					<div style={{ fontSize: '12px', marginTop: '5px', color: '#999' }}>
						URL: {uri}
					</div>
				</div>
			</div>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<WebView
				originWhitelist={['*']}
				javaScriptEnabled={true}
				domStorageEnabled={true}
				allowFileAccess={true}
				allowUniversalAccessFromFileURLs={true}
				mixedContentMode="always"
				source={{ uri }}
				style={styles.webview}
				onError={(syntheticEvent) => {
					const { nativeEvent } = syntheticEvent;
					console.error('WebView error:', nativeEvent);
				}}
				onHttpError={(syntheticEvent) => {
					const { nativeEvent } = syntheticEvent;
					console.error('WebView HTTP error:', nativeEvent.statusCode, nativeEvent.url);
				}}
				onLoadStart={() => {
					console.log('WebView started loading');
				}}
				onLoadEnd={() => {
					console.log('WebView finished loading');
				}}
				onMessage={(event) => {
					console.log('WebView message:', event.nativeEvent.data);
				}}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1e1e1e',
	},
	webview: {
		flex: 1,
		backgroundColor: '#1e1e1e',
	},
});
