import React from 'react';
import { StatusBar, View, Text, TouchableOpacity } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

class ChvErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('CHV ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F0F8F0' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#E74C3C', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: '#2980B9', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ChvErrorBoundary>
    <LanguageProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#004d26" />
        <AppNavigator />
      </AuthProvider>
    </LanguageProvider>
    </ChvErrorBoundary>
  );
}
