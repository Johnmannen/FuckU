/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StartScreen from './components/StartScreen';
import ResultScreen from './components/ResultScreen';
import GalleryScreen from './components/GalleryScreen';
import AuthModal from './components/AuthModal';
import { ScreenType, ScreamRecord, UserProfile } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { syncLocalToCloud } from './lib/storage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [latestScream, setLatestScream] = useState<(Omit<ScreamRecord, 'id' | 'imageUrl' | 'timestamp'> & { audioBlob: Blob }) | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          email: firebaseUser.email
        };
        setUser(profile);
        // Sync local screams to cloud on login
        syncLocalToCloud(firebaseUser.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle recorded scream from start screen
  const handleScreamRecorded = (scream: Omit<ScreamRecord, 'id' | 'imageUrl' | 'timestamp'> & { audioBlob: Blob }) => {
    setLatestScream(scream);
    setCurrentScreen('result');
  };

  // Handle successful save from result screen
  const handleSaveComplete = () => {
    setLatestScream(null);
    setCurrentScreen('gallery');
  };

  // Handle discarding scream and going back to start
  const handleScreamAgain = () => {
    setLatestScream(null);
    setCurrentScreen('start');
  };

  return (
    <div className="bg-[#121212] min-h-screen text-gray-100 flex flex-col font-sans select-none overflow-x-hidden" id="app-root-wrapper">
      <AnimatePresence mode="wait">
        {currentScreen === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full"
            id="start-page-motion"
          >
            <StartScreen
              user={user}
              onScreamRecorded={handleScreamRecorded}
              onNavigateToGallery={() => setCurrentScreen('gallery')}
              onLoginClick={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}

        {currentScreen === 'result' && latestScream && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }} // Dramatic springy ease out
            className="w-full"
            id="result-page-motion"
          >
            <ResultScreen
              screamData={latestScream}
              user={user}
              onSaveComplete={handleSaveComplete}
              onScreamAgain={handleScreamAgain}
              onLoginClick={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}

        {currentScreen === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full"
            id="gallery-page-motion"
          >
            <GalleryScreen
              user={user}
              onBackToStart={() => setCurrentScreen('start')}
              onLoginClick={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
