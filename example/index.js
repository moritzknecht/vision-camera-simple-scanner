import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { name as appName } from './app.json';
import App from './src/App';

const WrappedApp = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

AppRegistry.registerComponent(appName, () => WrappedApp);
