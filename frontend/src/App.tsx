import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthProvider';
import { router } from './app/router';
import { queryClient } from './app/queryClient';
import './index.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider 
          router={router}
          future={{
            v7_startTransition: true,
          }}
        />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
