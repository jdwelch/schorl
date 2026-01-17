import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect } from 'react';
import { Mail, X, AlertCircle } from 'lucide-react-native';
import Constants from 'expo-constants';
import DevAuthBypass from './DevAuthBypass';
import { useAuth } from '@/src/contexts/AuthContext';

interface AuthPromptProps {
  onSignIn: (email: string) => Promise<void>;
  onDismiss: () => void;
}

export default function AuthPrompt({ onSignIn, onDismiss }: AuthPromptProps) {
  const { setSessionFromToken } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpoGo, setIsExpoGo] = useState(false);

  useEffect(() => {
    // Check if running in Expo Go
    const expoGo = Platform.OS !== 'web' &&
                   typeof __DEV__ !== 'undefined' &&
                   __DEV__ &&
                   !Constants.appOwnership;
    setIsExpoGo(expoGo);
  }, []);

  const handleBypass = async (token: string) => {
    try {
      await setSessionFromToken(token);
      onDismiss();
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to apply token');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      await onSignIn(email.trim());
      setStatus('sent');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Mail size={16} color="#9ca3af" style={styles.icon} />
            <Text style={styles.title}>Sign in to sync across devices</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {isExpoGo && Platform.OS !== 'web' && (
          <View style={styles.warningBox}>
            <AlertCircle size={16} color="#f59e0b" />
            <Text style={styles.warningText}>
              Magic links don't work in Expo Go. Test on web instead, or create a development build.
            </Text>
          </View>
        )}

        {status === 'sent' ? (
          <Text style={styles.successText}>
            {isExpoGo && Platform.OS !== 'web'
              ? 'Email sent, but deep links won\'t work in Expo Go. Try on web!'
              : 'Check your email for the magic link!'}
          </Text>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <Text style={styles.buttonText}>Send Magic Link</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        {/* Dev bypass for Expo Go / testing */}
        <DevAuthBypass onBypass={handleBypass} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#262626',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    color: '#e5e7eb',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 14,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#451a03',
    borderWidth: 1,
    borderColor: '#78350f',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
});