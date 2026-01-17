import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import { KeyRound } from 'lucide-react-native';

interface DevAuthBypassProps {
  onBypass: (token: string) => void;
}

export default function DevAuthBypass({ onBypass }: DevAuthBypassProps) {
  const [token, setToken] = useState('');
  const [expanded, setExpanded] = useState(false);

  if (!__DEV__) {
    return null; // Only show in development
  }

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(true)}
      >
        <KeyRound size={14} color="#6b7280" />
        <Text style={styles.expandText}>Dev: Bypass auth</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Development Auth Bypass</Text>
      <Text style={styles.description}>
        Sign in on web, copy the session token from browser console, paste here.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Paste session token..."
        placeholderTextColor="#6b7280"
        value={token}
        onChangeText={setToken}
        multiline
        numberOfLines={3}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setExpanded(false)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, !token.trim() && styles.submitButtonDisabled]}
          onPress={() => {
            if (token.trim()) {
              onBypass(token.trim());
              setToken('');
              setExpanded(false);
            }
          }}
          disabled={!token.trim()}
        >
          <Text style={styles.submitText}>Apply Token</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    marginTop: 8,
  },
  expandText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  container: {
    backgroundColor: '#1c1917',
    borderWidth: 1,
    borderColor: '#44403c',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 6,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  description: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 10,
    lineHeight: 16,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  input: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 4,
    padding: 8,
    color: '#e5e7eb',
    fontSize: 11,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  submitButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
});
