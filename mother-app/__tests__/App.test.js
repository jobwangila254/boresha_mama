import React from 'react';
import renderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-screens', () => {
  const RealComponent = jest.requireActual('react-native');
  return RealComponent;
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => <>{children}</>,
    SafeAreaView: ({ children }) => <>{children}</>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    initialWindowMetrics: null,
  };
});

jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false, isAuthenticated: false, login: jest.fn(), register: jest.fn(), logout: jest.fn(), setUser: jest.fn() }),
}));

jest.mock('../src/context/LanguageContext', () => ({
  LanguageProvider: ({ children }) => <>{children}</>,
  useTranslation: () => ({ t: k => k, language: 'en', setLanguage: jest.fn() }),
}));

jest.mock('../src/navigation/AppNavigator', () => {
  const { View, Text } = require('react-native');
  return () => <View><Text>AppNavigator</Text></View>;
});

test('renders without crashing', () => {
  const tree = renderer.create(<App />).toJSON();
  expect(tree).toBeTruthy();
});
