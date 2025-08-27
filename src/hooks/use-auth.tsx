
"use client";

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    register: (email: string, password: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: AppUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch additional user data from Firestore
                const userRef = doc(db, "users", firebaseUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUser({ id: firebaseUser.uid, ...userSnap.data() } as AppUser);
                } else {
                    // This case might happen if Firestore doc creation fails after registration
                    // Or if a user exists in Auth but not Firestore. We create a default profile.
                    const newUser: AppUser = { 
                        id: firebaseUser.uid,
                        uid: firebaseUser.uid,
                        email: firebaseUser.email!,
                        username: firebaseUser.displayName || 'Usuario Nuevo',
                        role: 'user', // Default role
                        avatar: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
                     };
                     await setDoc(userRef, newUser);
                     setUser(newUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const register = async (email: string, password: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const userCountSnapshot = await getDoc(doc(db, 'siteContent', 'userCount'));
        const isFirstUser = !userCountSnapshot.exists() || userCountSnapshot.data().count === 0;

        // Create user document in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const newUser: Omit<AppUser, 'id' | 'packages'> = {
            uid: firebaseUser.uid,
            email,
            username,
            avatar: `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            role: isFirstUser ? 'owner' : 'user', // First user is the owner
        };
        await setDoc(userRef, newUser);

        if (isFirstUser) {
             await setDoc(doc(db, 'siteContent', 'userCount'), { count: 1 });
        } else {
             const { increment } = await import('firebase/firestore');
             await updateDoc(doc(db, 'siteContent', 'userCount'), { count: increment(1) });
        }

        setUser({ id: firebaseUser.uid, ...newUser } as AppUser);
    };

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };
    
    // Show a global loader while authentication state is being determined
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout, setUser }}>
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

    