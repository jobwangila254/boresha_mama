import React from 'react';
import { View, Animated } from 'react-native';

export function enableScreens() {}
export function enableFreeze() {}
export function screensEnabled() { return false; }
export function freezeEnabled() { return false; }
export function shouldUseActivityState() { return false; }
export function isSearchBarAvailableForCurrentPlatform() { return false; }
export function isNewBackTitleImplementation() { return false; }
export function executeNativeBackPress() { return false; }

const createViewComponent = (displayName) => {
  const Comp = React.forwardRef(({ children, style, ...props }, ref) =>
    React.createElement(View, { ref, style, ...props }, children)
  );
  Comp.displayName = displayName;
  return Comp;
};

export const Screen = createViewComponent('Screen');
export const NativeScreen = Screen;
export const InnerScreen = Screen;
export const ScreenContext = React.createContext(Screen);

export const ScreenContainer = createViewComponent('ScreenContainer');
export const NativeScreenContainer = ScreenContainer;
export const NativeScreenNavigationContainer = ScreenContainer;

export const ScreenStack = React.forwardRef(({ children, style, ...props }, ref) =>
  React.createElement(View, { ref, style: [{ flex: 1 }, style], ...props }, children)
);
ScreenStack.displayName = 'ScreenStack';

const HeaderView = ({ children, ...props }) => React.createElement(View, props, children);
export const ScreenStackHeaderConfig = HeaderView;
export const ScreenStackHeaderSubview = HeaderView;
export const ScreenStackHeaderLeftView = HeaderView;
export const ScreenStackHeaderCenterView = HeaderView;
export const ScreenStackHeaderRightView = HeaderView;
export const ScreenStackHeaderBackButtonImage = (props) => React.createElement(View, props);
export const ScreenStackHeaderSearchBarView = HeaderView;
export const SearchBar = (props) => React.createElement(View, props);
export const NativeSearchBar = SearchBar;
export const NativeSearchBarCommands = {};
export const FullWindowOverlay = ({ children }) => React.createElement(React.Fragment, null, children);
export const NativeScreensModule = {};
export const GHContext = React.createContext({});

export default Screen;

const TransitionProgressContext = React.createContext({});
export function useTransitionProgress() {
  return React.useContext(TransitionProgressContext);
}

const AnimatedNativeScreen = Animated.createAnimatedComponent(Screen);
