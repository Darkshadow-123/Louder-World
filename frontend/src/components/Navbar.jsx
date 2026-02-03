import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Louder World</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    Events
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      {user?.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user?.displayName}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
