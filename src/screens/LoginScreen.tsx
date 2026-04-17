import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Container, Typography, GlassCard } from '../components/Base';
import { supabase } from '../services/supabase';
import { useStore } from '../store/useStore';
import { ENV } from '../config/env';
import { theme } from '../theme';
import { LogIn, UserPlus, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

type Mode = 'login' | 'signup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);
  const setUser = useStore((state) => state.setUser);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setSignUpDone(false);
  };

  const switchMode = (next: Mode) => {
    resetForm();
    setMode(next);
  };

  // ── VALIDAÇÕES ──────────────────────────────────────────
  const validate = (): string | null => {
    if (!email.trim()) return 'O email é obrigatório.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Introduz um email válido.';
    if (!password) return 'A palavra-passe é obrigatória.';
    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD_LENGTH)
        return `A palavra-passe deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
      if (password !== confirmPassword) return 'As passwords não coincidem.';
    }
    return null;
  };

  // ── LOGIN ────────────────────────────────────────────────
  const handleLogin = async () => {
    const err = validate();
    if (err) { Alert.alert('Atenção', err); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // setUser(data.user) REMOVED: App.tsx handles the session -> profile sync now.
    } catch (error: any) {
      Alert.alert('Falha na Autenticação', error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN UP ──────────────────────────────────────────────
  const handleSignUp = async () => {
    const err = validate();
    if (err) { Alert.alert('Atenção', err); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${ENV.SITE_URL}/login`,
        },
      });
      if (error) throw error;

      // Supabase pode exigir confirmação por email
      if (data.session) {
        // Confirmação desativada — login automático
        if (data.user) setUser(data.user as any);
      } else {
        // Confirmação por email ativada
        setSignUpDone(true);
      }
    } catch (error: any) {
      Alert.alert('Erro ao criar conta', error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER: confirmação por email pendente ───────────────
  if (signUpDone) {
    return (
      <Container safe style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Mail size={48} color={theme.colors.primary} style={styles.icon} />
            <Typography variant="h1" style={styles.title}>Verifica o teu email</Typography>
            <Typography variant="body" style={styles.subtitle}>
              Enviámos um link de confirmação para{'\n'}
              <Typography variant="body" style={{ color: theme.colors.primary }}>
                {email.trim()}
              </Typography>
              {'\n\n'}Confirma a conta e volta para entrar.
            </Typography>
          </View>

          <GlassCard style={styles.formCard}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => { resetForm(); setMode('login'); }}
            >
              <LogIn size={20} color="#fff" style={{ marginRight: 8 }} />
              <Typography variant="button" color="#fff">Ir para Entrar</Typography>
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Voltar atrás
            </Typography>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  // ── RENDER: formulário principal ─────────────────────────
  const isSignUp = mode === 'signup';

  return (
    <Container safe style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.header}>
            {isSignUp
              ? <UserPlus size={48} color={theme.colors.primary} style={styles.icon} />
              : <LogIn size={48} color={theme.colors.primary} style={styles.icon} />
            }
            <Typography variant="h1" style={styles.title}>
              {isSignUp ? 'Criar conta' : 'Bem-vindo'}
            </Typography>
            <Typography variant="body" style={styles.subtitle}>
              {isSignUp
                ? 'Cria a tua conta para aceder ao ecossistema de bem-estar.'
                : 'Inicia sessão para aceder ao teu ecossistema de bem-estar.'
              }
            </Typography>
          </View>

          {/* ── FORM CARD ── */}
          <GlassCard style={styles.formCard}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isSignUp ? 'Palavra-passe' : 'Palavra-passe'}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType={isSignUp ? 'newPassword' : 'password'}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                {showPassword
                  ? <EyeOff size={18} color="rgba(255,255,255,0.4)" />
                  : <Eye size={18} color="rgba(255,255,255,0.4)" />
                }
              </TouchableOpacity>
            </View>

            {/* Password hint */}
            {isSignUp && (
              <Typography variant="caption" style={styles.inputHint}>
                A palavra-passe deve ter pelo menos 8 caracteres.
              </Typography>
            )}

            {/* Confirmar password — apenas no signup */}
            {isSignUp && (
              <View style={[styles.inputContainer, { marginTop: 12 }]}>
                <Lock size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar palavra-passe"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  textContentType="newPassword"
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeButton}>
                  {showConfirm
                    ? <EyeOff size={18} color="rgba(255,255,255,0.4)" />
                    : <Eye size={18} color="rgba(255,255,255,0.4)" />
                  }
                </TouchableOpacity>
              </View>
            )}

            {/* Botão principal */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={isSignUp ? handleSignUp : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Typography variant="button" color="#fff">
                    {isSignUp ? 'Criar conta' : 'Entrar'}
                  </Typography>
                  <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Typography variant="caption" style={styles.dividerText}>ou</Typography>
              <View style={styles.dividerLine} />
            </View>

            {/* Alternar modo */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => switchMode(isSignUp ? 'login' : 'signup')}
            >
              <Typography variant="caption" style={styles.switchText}>
                {isSignUp
                  ? 'Já tenho conta — Entrar'
                  : 'Ainda não tenho conta — Criar conta'
                }
              </Typography>
            </TouchableOpacity>
          </GlassCard>

          {/* Voltar */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Voltar atrás
            </Typography>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05070A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  formCard: {
    padding: theme.spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
    // Fixes mobile overflow: explicit 0 padding so the flex container handles spacing
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 0, // critical: allows flex child to shrink below its content width
  },
  inputHint: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: -8,
    marginBottom: 4,
    marginLeft: 4,
    fontSize: 12,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 6,
    flexShrink: 0,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchText: {
    color: theme.colors.primary,
    fontSize: 13,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
});
