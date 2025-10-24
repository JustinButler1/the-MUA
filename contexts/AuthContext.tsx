import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isSignedIn: boolean;
  isLoading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // For now, let's force the app to show sign-in page
    // This will help us debug the issue
    console.log('AuthContext: Starting auth check');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', { session: !!session, error });
      setUser(session?.user ?? null);
      setIsSignedIn(!!session);
      setIsLoading(false);
    }).catch((error) => {
      console.log('Error getting session:', error);
      setUser(null);
      setIsSignedIn(false);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', { event, session: !!session });
      setUser(session?.user ?? null);
      setIsSignedIn(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername;
      
      // If it doesn't contain '@', treat it as a username and look up the email
      if (!emailOrUsername.includes('@')) {
        // Use RPC to get email from username
        const { data, error } = await supabase.rpc('get_email_from_username', {
          username_input: emailOrUsername
        });
        
        if (error || !data) {
          return { error: { message: 'Invalid username or password' } };
        }
        
        email = data;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      // Create the redirect URL for our app
      const redirectUrl = 'themua://';
      
      console.log('Starting Google OAuth with redirect:', redirectUrl);

      // For mobile OAuth, we need to handle the redirect ourselves
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl, // Tell Supabase to redirect here after auth
          skipBrowserRedirect: true, // We'll handle the browser ourselves
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        return { error };
      }

      // Open the OAuth URL in the system browser
      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        
        try {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          console.log('OAuth result:', JSON.stringify(result, null, 2));

          if (result.type === 'success' && result.url) {
            // Extract the tokens from the URL
            const url = result.url;
            console.log('OAuth callback URL:', url);
            
            // Parse the URL parameters (tokens can be in hash or query)
            const hashParams = url.split('#')[1];
            const queryParams = url.split('?')[1];
            const params = new URLSearchParams(hashParams || queryParams || '');
            
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            console.log('Tokens found:', { 
              hasAccessToken: !!access_token, 
              hasRefreshToken: !!refresh_token 
            });

            if (access_token) {
              console.log('Setting session with tokens...');
              // Set the session with the tokens
              const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token: refresh_token || '',
              });

              if (sessionError) {
                console.error('Session error:', sessionError);
                return { error: sessionError };
              }
              
              console.log('Google sign-in successful!');
              return { error: null };
            } else {
              console.error('No access token in callback URL');
              return { error: { message: 'No access token received' } };
            }
          } else if (result.type === 'cancel') {
            console.log('User cancelled OAuth');
            return { error: { message: 'Sign-in cancelled by user' } };
          } else if (result.type === 'dismiss') {
            console.log('OAuth dismissed');
            return { error: { message: 'Sign-in dismissed' } };
          } else {
            console.log('OAuth failed with result:', result);
            return { error: { message: 'Authentication failed' } };
          }
        } catch (browserError) {
          console.error('WebBrowser error:', browserError);
          return { error: browserError };
        }
      }

      return { error: { message: 'No OAuth URL received' } };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, isLoading, user, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
