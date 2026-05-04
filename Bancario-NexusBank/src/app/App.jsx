import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './router/AppRoutes.jsx';

export const App = () => {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: 'inherit',
            fontWeight: 600,
          },
        }}
      />
      <AppRoutes />
    </>
  );
};