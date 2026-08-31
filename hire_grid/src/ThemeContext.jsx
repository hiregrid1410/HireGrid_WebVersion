import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./lib/api";

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.theme) return user.theme;
      }
    } catch (e) {}
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const syncUserTheme = (user) => {
    if (user && user.theme && user.theme !== theme) {
      setTheme(user.theme);
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          user.theme = nextTheme;
          localStorage.setItem("user", JSON.stringify(user));
          if (user.role === "admin" || user.role === "content_manager") {
            await api.put(`/admin_users/${user.id}`, { theme: nextTheme }).catch(() => {});
          } else {
            await api.put(`/users/${user.id}`, { theme: nextTheme }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync theme preference:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, syncUserTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
