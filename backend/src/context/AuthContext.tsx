import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { UserData } from "../../../frontend/src/services/api.js";

interface AuthContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem("meditrack_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("meditrack_user");
      }
    }
  }, []);

  const handleSetUser = (userData: UserData | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("meditrack_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("meditrack_user");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("meditrack_user");
  };

  const value = {
    user,
    setUser: handleSetUser,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
