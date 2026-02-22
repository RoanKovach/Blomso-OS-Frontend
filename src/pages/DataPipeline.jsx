import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataSource } from '@/api/entities';
import { DataSourceHealthService } from '@/components/services/dataSourceHealthService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, PlusCircle, Loader2 } from 'lucide-react';
import DataSourceHealthCard from '../components/datapipeline/DataSourceHealthCard';
import DataSourceSetup from '../components/datapipeline/DataSourceSetup';
import { useToasts } from '@/components/hooks/useToasts';

const DATA_SOURCES_QUERY_KEY = ['dataSources'];

export default function DataPipelinePage() {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError, notifyInfo } = useToasts();
  const [isSetupView, setIsSetupView] = React.useState(false);

  // Fetch all data sources using React Query for caching
  const { data: sources, isLoading, isError } = useQuery({
    queryKey: DATA_SOURCES_QUERY_KEY,
    queryFn: () => DataSource.list(),
  });

  // Mutation for checking all sources
  const { mutate: checkAll, isLoading: isCheckingAll } = useMutation({
    mutationFn: () => DataSourceHealthService.checkAllSources(),
    onSuccess: (results) => {
      let changed = false;
      results.forEach(({ oldStatus, newStatus, sourceName }) => {
        if (newStatus !== oldStatus) {
          changed = true;
          if (newStatus === 'active') {
            notifySuccess(`Source "${sourceName}" is now connected.`);
          } else if (newStatus === 'error') {
            notifyError(`Source "${sourceName}" failed to connect.`);
          } else if (newStatus === 'auth_required') {
            notifyInfo(`Source "${sourceName}" requires re-authentication.`);
          }
        }
      });
      if (changed) {
        queryClient.invalidateQueries(DATA_SOURCES_QUERY_KEY);
      } else {
        toast.info("All sources are up to date.");
      }
    },
    onError: (error) => notifyError(error),
  });

  // Mutation for checking a single source
  const { mutate: checkOne, isLoading: isCheckingOne } = useMutation({
    mutationFn: (sourceId) => DataSourceHealthService.checkSourceStatus(sourceId),
    onSuccess: ({ oldStatus, newStatus, sourceName }) => {
      if (newStatus !== oldStatus) {
        queryClient.invalidateQueries(DATA_SOURCES_QUERY_KEY);
        // Notification logic is similar to checkAll
        if (newStatus === 'active') notifySuccess(`Source "${sourceName}" is connected.`);
        else notifyError(`Check for "${sourceName}" resulted in status: ${newStatus}`);
      } else {
        toast.info(`Source "${sourceName}" status is unchanged.`);
      }
    },
    onError: (error) => notifyError(error),
  });

  // Periodically check sources every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isCheckingAll) {
        checkAll();
      }
    }, 1000 * 60 * 5); // 5 minutes

    return () => clearInterval(intervalId);
  }, [checkAll, isCheckingAll]);

  if (isSetupView) {
    return (
      <DataSourceSetup 
        onSetupComplete={() => {
          queryClient.invalidateQueries(DATA_SOURCES_QUERY_KEY);
          setIsSetupView(false);
        }}
        onCancel={() => setIsSetupView(false)}
      />
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Data Pipeline</h1>
            <p className="text-lg text-gray-600">Monitor and manage your connected data sources.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => checkAll()} disabled={isCheckingAll}>
              {isCheckingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check All
            </Button>
            <Button onClick={() => setIsSetupView(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
          </div>
        </div>

        {isLoading && <p>Loading data sources...</p>}
        {isError && <p className="text-red-500">Error loading data sources.</p>}

        {sources && sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source) => (
              <DataSourceHealthCard 
                key={source.id}
                source={source}
                onRetry={checkOne}
                isChecking={isCheckingOne}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium text-gray-700">No Data Sources Connected</h3>
            <p className="text-gray-500 mt-2 mb-4">Get started by adding your first data source.</p>
            <Button onClick={() => setIsSetupView(true)}>Add Data Source</Button>
          </div>
        )}
      </div>
    </div>
  );
}