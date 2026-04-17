import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Container, Typography } from '../components/Base';
import { Button } from './OnboardingWelcome';
import { theme } from '../theme';
import { Check } from 'lucide-react-native';
import { useStore } from '../store/useStore';

const GOALS = [
  'Energia e Vitalidade',
  'Recuperação Sistémica',
  'Performance Biológica',
  'Hidratação e Equilíbrio',
  'Gestão de Stress',
];

export const OnboardingGoals: React.FC<{ navigation: any }> = ({ navigation }) => {
  const guestProfile = useStore(state => state.guestProfile);
  const [selected, setSelected] = useState<string[]>(guestProfile?.goals || []);

  const toggleGoal = (goal: string) => {
    if (selected.includes(goal)) {
      setSelected(selected.filter(g => g !== goal));
    } else {
      setSelected([...selected, goal]);
    }
  };

  return (
    <Container safe style={styles.container}>
      <View style={styles.header}>
        <Typography variant="caption" color={theme.colors.primary}>PREFERÊNCIAS</Typography>
        <Typography variant="h2" style={styles.title}>Quais são os teus objetivos?</Typography>
        <Typography color={theme.colors.textSecondary}>Seleciona o que pretendes focar primeiro.</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal);
          return (
            <TouchableOpacity
              key={goal}
              onPress={() => toggleGoal(goal)}
              style={[styles.goalItem, isSelected && styles.goalSelected]}
            >
              <Typography style={isSelected ? { fontWeight: '600' } : undefined}>
                {goal}
              </Typography>
              {isSelected && <Check size={20} color={theme.colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Salvar e Voltar" 
          onPress={() => {
            useStore.getState().updateGuestProfile({ goals: selected });
            // Forçamos a entrada na aplicação
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          }}
          variant="primary"
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  scroll: {
    paddingBottom: theme.spacing.xl,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  goalSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
  footer: {
    marginTop: theme.spacing.md,
  }
});
