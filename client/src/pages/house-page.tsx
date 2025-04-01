import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { House, User } from '@shared/schema';
import { Loader2, ArrowLeft, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

export default function HousePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get houses data
  const { data: houses, isLoading: isLoadingHouses } = useQuery<House[]>({
    queryKey: ['/api/houses'],
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-primary text-white py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-primary-dark rounded-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="font-bold text-lg">House Points</div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md hover:bg-primary-dark text-white/90 hover:text-white">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 p-6">
        <div className="container mx-auto space-y-8">
          {isLoadingHouses ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Dashboard Button */}
              <div className="bg-blue-50 rounded-md p-4">
                <button 
                  onClick={() => setLocation('/house/dashboard')}
                  className="w-full text-left flex items-center space-x-3 text-primary hover:text-primary-dark"
                >
                  <span className="border border-blue-300 rounded p-2 bg-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  </span>
                  <div>
                    <div className="font-semibold">Points Dashboard</div>
                  </div>
                </button>
              </div>
              
              {/* Points Posters */}
              <div className="bg-white border rounded-md p-4">
                <button 
                  onClick={() => setLocation('/house/posters')}
                  className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                >
                  <span className="border border-gray-200 rounded p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="8" x2="8" y2="8"></line><line x1="16" y1="12" x2="8" y2="12"></line><line x1="16" y1="16" x2="8" y2="16"></line></svg>
                  </span>
                  <div>
                    <div className="font-semibold">Points Posters</div>
                  </div>
                </button>
              </div>
              
              {/* House Setup */}
              <div className="bg-white border rounded-md p-4">
                <button 
                  onClick={() => setLocation('/house/setup')}
                  className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                >
                  <span className="border border-gray-200 rounded p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <div>
                    <div className="font-semibold">House Setup</div>
                  </div>
                </button>
              </div>
              
              {/* House Options */}
              <div className="bg-white border rounded-md p-4">
                <button 
                  onClick={() => setLocation('/house/options')}
                  className="w-full text-left flex items-center space-x-3 text-gray-700 hover:text-primary"
                >
                  <span className="border border-gray-200 rounded p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </span>
                  <div>
                    <div className="font-semibold">Options</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
