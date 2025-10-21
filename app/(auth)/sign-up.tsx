import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!displayName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    
    setIsLoading(false);
  };

  const handleGoToSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>
        </View>

        {/* Main Content Card */}
        <View style={[styles.card, { backgroundColor: colors.background === '#fff' ? '#f5f5f5' : '#1a1a1f' }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            We will keep everything local for now, so feel free to experiment without limits.
          </Text>

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: '#ff4444' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View style={[styles.successContainer, { backgroundColor: '#00aa00' }]}>
              <Text style={styles.successText}>
                Account created! Please check your email to confirm your account.
              </Text>
            </View>
          )}

          {/* Display Name Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Display name</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background === '#fff' ? '#e5e5e5' : '#2a2a2f',
                color: colors.text 
              }]}
              placeholder="Enter your display name"
              placeholderTextColor={colors.icon}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background === '#fff' ? '#e5e5e5' : '#2a2a2f',
                color: colors.text 
              }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.icon}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background === '#fff' ? '#e5e5e5' : '#2a2a2f',
                color: colors.text 
              }]}
              placeholder="Create a password"
              placeholderTextColor={colors.icon}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[
              styles.signUpButton, 
              { 
                backgroundColor: isLoading ? colors.icon : colors.tint,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity onPress={handleGoToSignIn} style={styles.signInContainer}>
            <Text style={[styles.signInText, { color: colors.tint }]}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  card: {
    flex: 1,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  signUpButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});