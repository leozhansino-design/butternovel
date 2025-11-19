'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import AuthModal from '@/components/auth/AuthModal';
import UserMenu from '@/components/shared/UserMenu';
import LibraryModal from '@/components/shared/LibraryModal';
import SearchInput from '@/components/search/SearchInput';
import NotificationBell from '@/components/notification/NotificationBell';
import { CATEGORIES } from '@/lib/constants';

export default function Header() {
  // ✅ Use useSession to get real-time session updates
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login',
  });
  const [libraryModal, setLibraryModal] = useState<{ isOpen: boolean; defaultView: 'profile' | 'library' }>({
    isOpen: false,
    defaultView: 'library'
  });
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: pathname });
  };

  const openAuthModal = (tab: 'login' | 'register') => {
    setAuthModal({ isOpen: true, tab });
    setIsMenuOpen(false);
  };

  const openLibraryModal = (view: 'profile' | 'library' = 'library') => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setLibraryModal({ isOpen: true, defaultView: view });
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-effect border-b border-sky-200/50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo - 📱 优化移动端尺寸 */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <div className="text-xl sm:text-2xl">🧈</div>
              <span className="text-base sm:text-xl font-bold text-gray-900">ButterNovel</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </Link>
              <button
                onClick={() => openLibraryModal('library')}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Library
              </button>
              
              {/* Categories Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center gap-1">
                  Categories
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-48 glass-effect rounded-lg card-shadow-lg border border-sky-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    {CATEGORIES.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors rounded-md mx-1"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {user ? (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Writer Dashboard
                </Link>
              ) : (
                <Link
                  href="/writer"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Become a Writer
                </Link>
              )}
            </nav>

            {/* Search Bar - Desktop (with autocomplete) */}
            <div className="hidden md:block w-80 lg:w-96">
              <SearchInput placeholder="Search novels..." />
            </div>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <NotificationBell />
                  <UserMenu user={user} onOpenLibrary={openLibraryModal} />
                </>
              ) : (
                <>
                  <button 
                    onClick={() => openAuthModal('login')}
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="btn-gradient-primary px-4 py-2 text-white font-medium rounded-lg shadow-md"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button - 📱 优化触控区域 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 text-gray-700 hover:text-gray-900 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu - 📱 优化移动端样式 */}
          {isMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-200">
              {/* Mobile Search (with autocomplete) */}
              <div className="mb-3">
                <SearchInput placeholder="Search novels..." />
              </div>

              <nav className="space-y-0.5">
                <Link
                  href="/"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <button
                  onClick={() => openLibraryModal('library')}
                  className="w-full text-left block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Library
                </button>

                <div className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">
                  Categories
                </div>
                {CATEGORIES.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="block px-3 py-1.5 pl-6 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}

                {user ? (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Writer Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/writer"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Become a Writer
                  </Link>
                )}

                <div className="pt-3 mt-3 border-t border-gray-200 space-y-1">
                  {user ? (
                    <>
                      <div className="px-3 py-2 flex items-center gap-2.5">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || 'User'}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-sky-700 font-semibold border border-sky-200 flex-shrink-0 text-sm">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate">{user.name}</div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => openLibraryModal('profile')}
                        className="w-full text-left block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        👤 Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🚪 Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="block w-full px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="btn-gradient-primary block w-full px-3 py-2 text-center text-sm text-white rounded-lg shadow-md font-medium"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultTab={authModal.tab}
      />

      {user && (
        <LibraryModal
          isOpen={libraryModal.isOpen}
          onClose={() => setLibraryModal({ ...libraryModal, isOpen: false })}
          user={user}
          defaultView={libraryModal.defaultView}
        />
      )}
    </>
  );
}