/**
 * Sign-in screen — supports email/password sign-in
 * (Google & Apple OAuth available as alternatives when configured)
 *
 * In MOCK_MODE this screen is never shown.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { firebaseAuth } from '@/lib/firebase';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import {
  FIREBASE_GOOGLE_WEB_CLIENT_ID,
  FIREBASE_GOOGLE_IOS_CLIENT_ID,
  FIREBASE_GOOGLE_ANDROID_CLIENT_ID,
} from '@/lib/config';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // ── Email/Password Sign-In ──
  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (err: any) {
      Alert.alert('Sign-in failed', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ── Email/Password Sign-Up ──
  const handleEmailSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);

      // Set the display name on the Firebase Auth user
      // so auth-context can pass it to api.initUser
      await updateProfile(userCred.user, { displayName: username });

      // Auth state change fires → auth-context calls api.initUser
      // which creates the Firestore user + profile docs on the backend
    } catch (err: any) {
      Alert.alert('Sign-up failed', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Show email sign-in form
  if (mode === 'email') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Back icon button (top left) */}
          <View style={styles.backButtonContainer}>
            <View style={styles.backButtonCircle}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={Colors.sageDark}
                onPress={() => setMode('options')}
                style={{ alignSelf: 'center' }}
                accessibilityLabel="Back"
              />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
          <Text style={styles.subheading}>
            {isSignUp ? 'Join Flourish and start saving' : 'Welcome back to Flourish'}
          </Text>

          {/* Email input */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Username input (sign-up only) */}
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          )}

          {/* Password input */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          {/* Sign-in/Sign-up button */}
          <FlourishButton
            title={loading ? 'Loading…' : isSignUp ? 'Create account' : 'Sign in'}
            onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
            fullWidth
            disabled={loading}
            style={{ marginTop: Spacing.lg }}
          />

          {/* Toggle sign-in/sign-up */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <FlourishButton
              title={isSignUp ? 'Sign in' : 'Create one'}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setUsername('');
              }}
              variant="outline"
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show sign-in options
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.branding}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={40} color={Colors.sageDark} />
          </View>
          <Text style={styles.appName}>Flourish</Text>
          <Text style={styles.tagline}>Small steps. Real savings. 🌱</Text>
        </View>

        {/* Sign-in buttons */}
        <View style={styles.buttons}>
          <FlourishButton
            title="Sign in with Email"
            onPress={() => setMode('email')}
            fullWidth
            variant="primary"
            icon="mail"
          />

          <FlourishButton
            title={loading ? 'Signing in…' : 'Continue with Google'}
            onPress={() => {}}
            fullWidth
            variant="outline"
            icon="logo-google"
            disabled={true}
            style={{ marginTop: Spacing.md, opacity: 0.5 }}
          />

          {Platform.OS === 'ios' && (
            <FlourishButton
              title={loading ? 'Signing in…' : 'Continue with Apple'}
              onPress={() => {}}
              fullWidth
              variant="outline"
              icon="logo-apple"
              disabled={true}
              style={{ marginTop: Spacing.md, opacity: 0.5 }}
            />
          )}

          <Text style={styles.disabledNote}>
            (OAuth sign-in requires configuration)
          </Text>
        </View>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service{'\n'}and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  branding: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    ...Typography.largeTitle,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  buttons: { marginBottom: Spacing.xl },
  legal: {
    ...Typography.footnote,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Email sign-in form styles
  heading: {
    ...Typography.title1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 2,
    borderColor: '#D4C5B9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    color: Colors.text,
    backgroundColor: '#FAFAF8',
    fontSize: 16,
  },
  toggleContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  disabledNote: {
    ...Typography.footnote,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
