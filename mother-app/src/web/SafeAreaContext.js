import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const initialInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const initialFrame = {
  x: 0, y: 0,
  width: (Dimensions.get('window') && Dimensions.get('window').width) || 0,
  height: (Dimensions.get('window') && Dimensions.get('window').height) || 0,
};

export const SafeAreaInsetsContext = React.createContext(initialInsets);
export const SafeAreaFrameContext = React.createContext(initialFrame);

export const SafeAreaProvider = ({ children, style }) =>
  React.createElement(SafeAreaInsetsContext.Provider, { value: initialInsets },
    React.createElement(SafeAreaFrameContext.Provider, { value: initialFrame },
      React.createElement(View, { style: [styles.fill, style] }, children)
    )
  );

export const SafeAreaView = React.forwardRef(({ children, style, ...props }, ref) =>
  React.createElement(View, { ref, style: [styles.fill, style], ...props }, children)
);
SafeAreaView.displayName = 'SafeAreaView';

export function useSafeAreaInsets() { return React.useContext(SafeAreaInsetsContext); }
export function useSafeAreaFrame() { return React.useContext(SafeAreaFrameContext); }
export function useSafeArea() { return useSafeAreaInsets(); }

export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;
export const SafeAreaContext = SafeAreaInsetsContext;
export const initialWindowMetrics = null;
export const initialWindowSafeAreaInsets = null;

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
