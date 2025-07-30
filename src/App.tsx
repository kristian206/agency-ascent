
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, getUserProfile } from './services/firebaseService';
import AuthPage from './components/AuthPage';
import DashboardPage from './components/DashboardPage';
import LeaderboardPage from './components/LeaderboardPage';
import ProfilePage from './components/ProfilePage';
import ReferralLogPage from './components/ReferralLogPage';
import ManagerAdminPage from './components/ManagerAdminPage';
import GodModeAdminPage from './components/GodModeAdminPage';
import SearchPage from './components/SearchPage';
import type { UserProfile } from './types';
import { FlameIcon, TrophyIcon, LayoutDashboardIcon, UserIcon, ClipboardListIcon, SearchIcon, UsersIcon, ShieldCheckIcon } from './components/ui/Icons';

// Mock auth state change listener
const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
    const user = auth.currentUser;
    callback(user);
    // This is a simplified mock. A real implementation would need a listener.
    return () => {}; // Return an unsubscribe function
};

function App() {
    const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(async (authUser) => {
            setUser(authUser);
            if (authUser) {
                const profile = await getUserProfile(authUser.uid);
                setUserProfile(profile);
                if (window.location.hash === '#/auth' || window.location.hash === '#/') {
                    navigate('/dashboard');
                }
            } else {
                setUserProfile(null);
                navigate('/auth');
            }
            setLoading(false);
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignOut = async () => {
        await auth.signOut();
        setUser(null);
        setUserProfile(null);
        navigate('/auth');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-brand-background">
                <div className="text-2xl font-bold text-white">Loading Agency Ascent...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-background text-brand-text">
            {user && userProfile ? (
                <div className="md:flex h-screen overflow-hidden">
                    <nav className="md:w-64 bg-brand-surface p-4 border-r border-brand-muted flex flex-col">
                       <div className="flex items-center mb-8">
                            <FlameIcon className="w-8 h-8 text-brand-primary" />
                            <h1 className="text-2xl font-bold text-white ml-2">Agency Ascent</h1>
                        </div>
                        <ul className="flex-grow">
                            <NavItem to="/dashboard" icon={<LayoutDashboardIcon className="w-5 h-5"/>}>Home</NavItem>
                            <NavItem to="/profile" icon={<UserIcon className="w-5 h-5"/>}>Profile</NavItem>
                            <NavItem to="/leaderboard" icon={<TrophyIcon className="w-5 h-5"/>}>Leaderboard</NavItem>
                            <NavItem to="/referrals" icon={<ClipboardListIcon className="w-5 h-5"/>}>Referrals</NavItem>
                            <NavItem to="/search" icon={<SearchIcon className="w-5 h-5"/>}>Search</NavItem>
                            {userProfile.role === 'manager' && (
                                <NavItem to="/manage-team" icon={<UsersIcon className="w-5 h-5"/>}>Manage Team</NavItem>
                            )}
                            {userProfile.role === 'admin' && (
                                <NavItem to="/god-mode" icon={<ShieldCheckIcon className="w-5 h-5"/>}>God Mode</NavItem>
                            )}
                        </ul>
                        <div>
                             <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-brand-text hover:bg-brand-muted hover:text-white">Sign Out</button>
                        </div>
                    </nav>
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        <Routes>
                            <Route path="/dashboard" element={<DashboardPage currentUser={user} />} />
                            <Route path="/profile" element={<ProfilePage currentUser={user} />} />
                             <Route path="/profile/:userId" element={<ProfilePage currentUser={user} />} />
                            <Route path="/leaderboard" element={<LeaderboardPage currentUser={user} />} />
                            <Route path="/referrals" element={<ReferralLogPage currentUser={user} />} />
                            <Route path="/search" element={<SearchPage currentUser={user} />} />
                            <Route path="/manage-team" element={<ManagerAdminPage currentUser={user} />} />
                            <Route path="/god-mode" element={<GodModeAdminPage currentUser={user} />} />
                        </Routes>
                    </main>
                </div>
            ) : (
                <Routes>
                    <Route path="/auth" element={<AuthPage onAuthSuccess={(authedUser) => setUser(authedUser)} />} />
                    <Route path="*" element={<AuthPage onAuthSuccess={(authedUser) => setUser(authedUser)} />} />
                </Routes>
            )}
        </div>
    );
}

interface NavItemProps {
    to: string;
    children: React.ReactNode;
    icon: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, icon }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <li className="mb-2">
            <Link to={to} className={`flex items-center p-2 rounded-md text-lg ${isActive ? 'bg-brand-primary text-white' : 'text-brand-text hover:bg-brand-muted'}`}>
                {icon}
                <span className="ml-3">{children}</span>
            </Link>
        </li>
    );
};

export default App;

