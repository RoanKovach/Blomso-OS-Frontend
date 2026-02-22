import React from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useOfflineMutations } from '../hooks/useOfflineMutations';

/**
 * Banner component that shows connection status and pending sync actions
 */
export const ConnectionStatusBanner = () => {
  const { isOnline, isJustBackOnline } = useConnectionStatus();
  const { hasPendingMutations, syncPendingMutations, isSyncing, pendingMutations } = useOfflineMutations();

  // Don't show banner if online and no pending actions
  if (isOnline && !hasPendingMutations && !isJustBackOnline) {
    return null;
  }

  const getBannerContent = () => {
    if (isJustBackOnline) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        message: 'Back online!',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    }

    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4 text-amber-600" />,
        message: `Offline mode ${hasPendingMutations ? `- ${pendingMutations.length} action${pendingMutations.length === 1 ? '' : 's'} queued` : ''}`,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200'
      };
    }

    if (hasPendingMutations) {
      return {
        icon: isSyncing ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <Wifi className="w-4 h-4 text-blue-600" />,
        message: isSyncing ? 'Syncing changes...' : `${pendingMutations.length} action${pendingMutations.length === 1 ? '' : 's'} pending sync`,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div className={`${content.bgColor} ${content.borderColor} border-b px-4 py-3`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {content.icon}
          <span className={`text-sm font-medium ${content.textColor}`}>
            {content.message}
          </span>
        </div>
        
        {isOnline && hasPendingMutations && !isSyncing && (
          <Button
            variant="outline"
            size="sm"
            onClick={syncPendingMutations}
            className={`${content.textColor} border-current hover:bg-current hover:bg-opacity-10`}
          >
            Sync Now
          </Button>
        )}
      </div>
    </div>
  );
};