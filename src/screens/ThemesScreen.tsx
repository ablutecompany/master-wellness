import React from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Container, Typography } from '../components/Base';
import { ThemeCard } from '../components/ThemeCard';
import { getSemanticInsights } from '../services/insights';
import { semanticOutputService } from '../services/semantic-output';

export const ThemesScreen: React.FC = () => {
  const [themes, setThemes] = React.useState(getSemanticInsights());

  React.useEffect(() => {
    const unsubscribe = semanticOutputService.subscribe(() => {
      const insights = getSemanticInsights();
      setThemes(insights);

      // Telemetria: Rastro de visualização de domínios na lista de Temas
      insights.forEach(insight => {
        const bundle = semanticOutputService.getBundle();
        if (!bundle) return;
        const output = bundle.domains[insight.domain];
        if (!output) return;

        const { semanticTelemetry } = require('../services/semantic-output/telemetry/engine');
        semanticTelemetry.record({
          eventType: output.status === 'sufficient_data' ? 'insight_displayed' : 'insufficient_data_state_displayed',
          domain: insight.domain,
          bundleVersion: bundle.bundleVersion,
          semanticVersion: '1.2.0',
          screen: 'themes',
          status: output.status,
          insightIds: output.insights.map(i => i.id),
          recommendationIds: output.recommendations.map(r => r.id),
          evidenceRefIds: output.inputSummary.trace,
          source: 'shell'
        });
      });
    });
    return unsubscribe;
  }, []);

  return (
    <Container safe style={styles.container}>
      <View style={styles.atmosphere}>
        <View style={styles.aura} />
      </View>

      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>Temas AI</Typography>
        <Typography style={styles.subtitle}>Insights baseados no teu contexto atual</Typography>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {themes.map((theme, index) => (
          <ThemeCard key={index} {...theme} />
        ))}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05070A',
    flex: 1,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    top: -200,
    right: -200,
    backgroundColor: 'rgba(0, 242, 255, 0.03)',
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : {}),
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  }
});
