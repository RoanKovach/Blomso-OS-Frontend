import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  active: {
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Connected',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Error',
  },
  auth_required: {
    icon: <ShieldAlert className="w-5 h-5 text-yellow-500" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Auth Required',
  },
  setup_incomplete: {
    icon: <AlertTriangle className="w-5 h-5 text-gray-500" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Setup Incomplete',
  },
};

export default function DataSourceHealthCard({ source, onRetry, isChecking }) {
  const config = statusConfig[source.status] || statusConfig.setup_incomplete;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{source.source_name}</CardTitle>
        <Badge className={config.color}>
          {config.icon}
          <span className="ml-2">{config.label}</span>
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Provider: {source.provider}</p>
        {source.last_sync && (
          <p className="text-xs text-muted-foreground mt-1">
            Last checked: {formatDistanceToNow(new Date(source.last_sync), { addSuffix: true })}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onRetry(source.id)}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Check Status
        </Button>
        <Button variant="secondary" size="sm">
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}