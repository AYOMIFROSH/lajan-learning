import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { firebase, firestoreDB } from '@/firebase/config';
import colors from '@/constants/colors';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Log error to Firebase
async function logErrorToFirebase(error: any, errorInfo?: any) {
  try {
    // Get the current user if logged in
    const currentUser = firebase.auth().currentUser;
    const userId = currentUser?.uid || 'unknown-user';
    
    // Log to Firestore for analytics
    await firestoreDB.collection('error_logs').add({
      userId,
      error: {
        message: error?.message || error?.toString() || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
      },
      platform: 'ios',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('Error logged to Firebase successfully');
  } catch (logError) {
    console.error('Failed to log error to Firebase:', logError);
  }
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToFirebase(error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>{this.state.error?.message}</Text>
            <Text style={styles.description}>
              Please try again or restart the app if the problem persists.
            </Text>
            
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.light,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 

export default ErrorBoundary;