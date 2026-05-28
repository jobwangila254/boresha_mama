import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

jest.mock('../components/ErrorBoundary', () => ({ children }) => <>{children}</>);
jest.mock('../context/LanguageContext', () => ({
  LanguageProvider: ({ children }) => <>{children}</>,
  useTranslation: () => ({ t: k => k, language: 'en', setLanguage: () => {} }),
}));

test('renders without crashing', () => {
  render(<App />);
});
