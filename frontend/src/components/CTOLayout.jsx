import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu, X, Activity } from 'lucide-react';
import geuLogo from '../assets/geu-logo.webp';

const CTOLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInfoString = localStorage.getItem('userInfo');
  if (!userInfoString) {
    return <Navigate to="/login" replace />;
  }
  const userInfo = JSON.parse(userInfoString);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm flex items-center justify-between px-3 sm:px-6 z-30">
        <div className="flex items-center gap-2 sm:gap-4 h-full">
          {/* Mobile Hamburger Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#1c1f58] hover:bg-gray-100 focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <img 
            src={geuLogo} 
            alt="Graphic Era University" 
            className="h-8 sm:h-10 object-contain"
          />
          <div className="hidden xs:block w-px h-6 sm:h-8 bg-gray-300 mx-1 sm:mx-2"></div>
          <h1 className="text-sm sm:text-lg font-bold text-[#1c1f58] tracking-wide truncate max-w-[140px] sm:max-w-none">
            PBL CTO
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#1c1f58] truncate max-w-[150px]">
              {userInfo?.name || 'CTO'}
            </p>
            <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
              {userInfo?.email || ''}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#fbc02d] flex items-center justify-center text-[#1c1f58] font-bold shadow-md text-base sm:text-lg shrink-0">
            {userInfo?.name?.charAt(0) || 'C'}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex w-full h-full pt-16 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-[#1c1f58] text-white shadow-xl z-10 shrink-0">
          <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Main Menu</div>
            <a 
              href="/cto/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/cto/dashboard' ? 'bg-[#fbc02d] text-[#1c1f58] font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
            >
              <LayoutDashboard size={20} className={location.pathname === '/cto/dashboard' ? 'text-[#1c1f58]' : ''} />
              Dashboard
            </a>
            <a 
              href="/cto/logs"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/cto/logs' ? 'bg-[#fbc02d] text-[#1c1f58] font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
            >
              <Activity size={20} className={location.pathname === '/cto/logs' ? 'text-[#1c1f58]' : ''} />
              System Logs
            </a>
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors font-medium"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Mobile Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 w-64 bg-[#1c1f58] text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10 h-16">
            <span className="font-bold text-lg tracking-wider">Menu</span>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto h-[calc(100%-130px)]">
            <a 
              href="/cto/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/cto/dashboard' ? 'bg-[#fbc02d] text-[#1c1f58] font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard size={20} className={location.pathname === '/cto/dashboard' ? 'text-[#1c1f58]' : ''} />
              Dashboard
            </a>
            <a 
              href="/cto/logs"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === '/cto/logs' ? 'bg-[#fbc02d] text-[#1c1f58] font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Activity size={20} className={location.pathname === '/cto/logs' ? 'text-[#1c1f58]' : ''} />
              System Logs
            </a>
          </nav>

          <div className="p-4 border-t border-white/10 absolute bottom-0 w-full">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors font-medium"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 relative">
          <div className="absolute inset-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CTOLayout;
