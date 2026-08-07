import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'DISPATCHER' | 'TECHNICIAN' | 'CUSTOMER';
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (id: string, token: string, name: string, email: string, role: User['role']) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to load credentials on app startup
    const storedId = localStorage.getItem('keystone_id');
    const storedToken = localStorage.getItem('keystone_token');
    const storedName = localStorage.getItem('keystone_name');
    const storedEmail = localStorage.getItem('keystone_email');
    const storedRole = localStorage.getItem('keystone_role') as User['role'] | null;

    if (storedId && storedToken && storedName && storedEmail && storedRole) {
      setUser({
        id: storedId,
        token: storedToken,
        name: storedName,
        email: storedEmail,
        role: storedRole,
      });
    }
    setLoading(false);
  }, []);

  const login = (id: string, token: string, name: string, email: string, role: User['role']) => {
    localStorage.setItem('keystone_id', id);
    localStorage.setItem('keystone_token', token);
    localStorage.setItem('keystone_name', name);
    localStorage.setItem('keystone_email', email);
    localStorage.setItem('keystone_role', role);

    setUser({ id, token, name, email, role });
  };

  const logout = () => {
    localStorage.removeItem('keystone_id');
    localStorage.removeItem('keystone_token');
    localStorage.removeItem('keystone_name');
    localStorage.removeItem('keystone_email');
    localStorage.removeItem('keystone_role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
