export const AuthContainer = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 auth-root">
      {children}
    </div>
  );
};
