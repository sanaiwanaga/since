import { createContext, createElement, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { AppLanguage } from '../types';
import { en } from './en';
import { ja } from './ja';

export const translations = {
  ja,
  en,
} as const;

export type Messages = (typeof translations)[AppLanguage];

const I18nContext = createContext<{ language: AppLanguage; messages: Messages }>({
  language: 'ja',
  messages: ja,
});

export const I18nProvider = ({ language, children }: PropsWithChildren<{ language: AppLanguage }>) => (
  createElement(
    I18nContext.Provider,
    { value: { language, messages: translations[language] } },
    children,
  )
);

export const useI18n = () => useContext(I18nContext);
