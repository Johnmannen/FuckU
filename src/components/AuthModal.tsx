import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, Mail } from 'lucide-react';
import { auth, googleProvider, facebookProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      onClose();
    } catch (err) {
      console.error('Facebook login failed:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[32px] p-8 relative z-10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/20">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-display font-black uppercase tracking-tight text-white">Säkra dina monster</h2>
              <p className="text-neutral-400 text-xs mt-2 leading-relaxed">
                Logga in för att spara dina skrik permanent i molnet och dela dem med vänner.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full py-4 bg-white hover:bg-neutral-100 text-black rounded-2xl flex items-center justify-center gap-3 font-bold text-xs transition-all active:scale-95"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                Logga in med Google
              </button>

              <button
                onClick={handleFacebookLogin}
                className="w-full py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-xs transition-all active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 3.865 11.074 9.234 12.834v-9.078H6.037v-3.756h3.197V9.302c0-3.155 1.939-4.897 4.756-4.897 1.348 0 2.756.24 2.756.24v3.03h-1.551c-1.56 0-2.046.969-2.046 1.956v2.353h3.414l-.546 3.756h-2.868v9.078C20.135 23.147 24 18.063 24 12.073z" />
                </svg>
                Logga in med Facebook
              </button>
            </div>

            <p className="text-center text-[10px] text-neutral-600 mt-6 uppercase tracking-widest font-mono">
              Fortsätt anonymt om du vill stanna lokalt
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
