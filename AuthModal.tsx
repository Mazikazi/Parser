// components/auth/AuthModal.tsx

const handleOAuth = async (provider: 'google' | 'github') => {
  await supabase.auth.signInWithOAuth({
    provider,
    options: { 
      redirectTo: `${window.location.origin}/auth/callback` // Recommended to have a dedicated callback route
    }
  });
};
