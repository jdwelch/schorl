import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
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
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpoGo, setIsExpoGo] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Check if running in Expo Go
    const expoGo = Platform.OS !== 'web' &&
                   typeof __DEV__ !== 'undefined' &&
                   __DEV__ &&
                   !Constants.appOwnership;
    setIsExpoGo(expoGo);
  }, []);

  // Auto-focus OTP input when switching to sent state
  useEffect(() => {
    if (status === 'sent' && otpInputRef.current) {
      // Small delay to ensure render is complete
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [status]);

  // Simple email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

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
      setSentEmail(email.trim());
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code');
      return;
    }

    setVerifying(true);
    setErrorMessage('');

    try {
      const { supabase } = await import('@/src/lib/supabase');

      const { data, error } = await supabase.auth.verifyOtp({
        email: sentEmail,
        token: otp.trim(),
        type: 'email',
      });

      if (error) throw error;

      if (data.session) {
        // Success! Session is automatically set by Supabase
        onDismiss();
      } else {
        throw new Error('Authentication succeeded but no session created');
      }
    } catch (error) {
      console.error('Verify OTP failed:', error);
      // Keep status as 'sent' so form stays visible
      setErrorMessage(error instanceof Error ? error.message : 'Invalid code. Please try again.');
      // Clear OTP field to make it easier to retry
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(digits);

    // Auto-submit when 6 digits entered
    if (digits.length === 6 && !verifying) {
      // Small delay to let the user see the complete code
      setTimeout(() => {
        if (!verifying) {
          handleVerifyOtp();
        }
      }, 300);
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


        {status === 'sent' ? (
          <View>
            <Text style={styles.successText}>
              Check your email for a 6-digit code
            </Text>
            <View style={styles.otpForm}>
              <TextInput
                ref={otpInputRef}
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#6b7280"
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                maxLength={6}
                editable={!verifying}
                onSubmitEditing={handleVerifyOtp}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.button, (verifying || otp.length !== 6) && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={verifying || otp.length !== 6}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#1a1a1a" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                setStatus('idle');
                setOtp('');
                setSentEmail('');
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Use different email</Text>
            </TouchableOpacity>
          </View>
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
              style={[styles.button, (loading || !isValidEmail(email)) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !isValidEmail(email)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {errorMessage && (
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
    marginBottom: 8,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  instructionText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  otpForm: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  otpInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  backButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 12,
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