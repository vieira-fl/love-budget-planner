import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase client
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id);
            setAuthState({
              user: session.user,
              session,
              profile,
              loading: false,
            });
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setAuthState({
          user: session.user,
          session,
          profile,
          loading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username,
          },
        },
      });

      if (error) {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode fazer login.',
      });

      return { data };
    } catch (error) {
      console.error('SignUp error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta!',
      });

      return { data };
    } catch (error) {
      console.error('SignIn error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'Erro ao sair',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Até logo!',
        description: 'Você saiu da sua conta.',
      });

      return { success: true };
    } catch (error) {
      console.error('SignOut error:', error);
      return { error };
    }
  };

  return {
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signOut,
  };
}
