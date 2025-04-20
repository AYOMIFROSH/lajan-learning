import { StyleSheet } from 'react-native';
import colors from './colors';

export const typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  h4: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkGray,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: colors.dark,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: colors.darkGray,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default typography;