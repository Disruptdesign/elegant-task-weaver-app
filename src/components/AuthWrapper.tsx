
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogIn, UserPlus, LogOut, Mail, Lock } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth event:', event, !!session?.user);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          setAuthMessage('Connexion réussie !');
          setAuthError(null);
        } else if (event === 'SIGNED_OUT') {
          setAuthMessage('Déconnexion réussie');
          setAuthError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setAuthError('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          setAuthError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setAuthError(error.message);
        }
      }
    } catch (error) {
      setAuthError('Une erreur inattendue s\'est produite');
      console.error('Sign in error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    setAuthMessage(null);

    if (password !== confirmPassword) {
      setAuthError('Les mots de passe ne correspondent pas');
      setIsAuthenticating(false);
      return;
    }

    if (password.length < 6) {
      setAuthError('Le mot de passe doit contenir au moins 6 caractères');
      setIsAuthenticating(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setAuthError('Un compte existe déjà avec cette adresse email');
        } else {
          setAuthError(error.message);
        }
      } else {
        setAuthMessage('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setAuthError('Une erreur inattendue s\'est produite');
      console.error('Sign up error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthenticating(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const clearMessages = () => {
    setAuthError(null);
    setAuthMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Gestionnaire de Tâches
            </CardTitle>
            <CardDescription className="text-gray-600">
              Connectez-vous pour accéder à votre planificateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" onClick={clearMessages}>
                  <LogIn size={16} className="mr-2" />
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="signup" onClick={clearMessages}>
                  <UserPlus size={16} className="mr-2" />
                  Inscription
                </TabsTrigger>
              </TabsList>

              {authError && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {authError}
                  </AlertDescription>
                </Alert>
              )}

              {authMessage && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    {authMessage}
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Connexion...
                      </div>
                    ) : (
                      <>
                        <LogIn size={16} className="mr-2" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isAuthenticating}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isAuthenticating}
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isAuthenticating}
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Inscription...
                      </div>
                    ) : (
                      <>
                        <UserPlus size={16} className="mr-2" />
                        S'inscrire
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Gestionnaire de Tâches
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                disabled={isAuthenticating}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
