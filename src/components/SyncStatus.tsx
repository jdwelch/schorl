import { View, Text, StyleSheet, Platform } from 'react-native';
import { Cloud, CloudOff, Loader2 } from 'lucide-react-native';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncStatusProps {
  state: SyncState;
  lastSync?: Date | null;
}

export default function SyncStatus({ state, lastSync }: SyncStatusProps) {
  const getIcon = () => {
    switch (state) {
      case 'synced':
        return <Cloud size={14} color="#10b981" />;
      case 'syncing':
        return <Loader2 size={14} color="#3B82F6" />;
      case 'offline':
      case 'error':
        return <CloudOff size={14} color="#6b7280" />;
    }
  };

  const getText = () => {
    switch (state) {
      case 'synced':
        if (lastSync) {
          const now = Date.now();
          const diff = now - lastSync.getTime();
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);

          if (seconds < 60) return 'Synced just now';
          if (minutes < 60) return `Synced ${minutes}m ago`;
          if (hours < 24) return `Synced ${hours}h ago`;
          return 'Synced';
        }
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Sync error';
    }
  };

  const getTextColor = () => {
    switch (state) {
      case 'synced':
        return '#10b981';
      case 'syncing':
        return '#3B82F6';
      case 'offline':
      case 'error':
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      {getIcon()}
      <Text style={[styles.text, { color: getTextColor() }]}>
        {getText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontFamily: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
});
