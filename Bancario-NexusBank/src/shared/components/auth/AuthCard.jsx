export const AuthCard = ({ logoSrc, logoAlt, title, subtitle, children }) => {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-10 auth-card">
      <div className="flex justify-center mb-6">
        <img src={logoSrc} alt={logoAlt} className="h-20 w-auto" />
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 text-base max-w-md mx-auto">{subtitle}</p>
      </div>

      {children}
    </div>
  );
};
