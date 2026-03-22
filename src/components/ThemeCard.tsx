import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from './Base';
import { theme } from '../theme';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { Activity, Zap, Target, Heart, Moon, Brain, User } from 'lucide-react-native';

const IconMap = { Activity, Zap, Target, Heart, Moon, Brain, User };

interface ThemeProps {
  title: string;
  paragraph1: string;
  paragraph2: string;
  refText1: string;
  refText2: string;
  score?: number;
  iconName?: keyof typeof IconMap;
  suggestions?: { title: string, desc: string }[];
}

const ScoreGauge = ({ score, iconName, label }: { score: number, iconName?: keyof typeof IconMap, label?: string }) => {
  const radius = 34;
  const strokeWidth = 5;
  const center = 40;
  const circumference = 2 * Math.PI * radius;
  
  const arcLength = (270 / 360) * circumference;
  const gap = circumference - arcLength;
  const progressLength = (score / 100) * arcLength;
  
  const IconCmp = iconName && IconMap[iconName] ? IconMap[iconName] : Activity;

  let startColor = '#00F2FF'; 
  let endColor = '#00FF9D'; 
  if (score < 50) {
    startColor = '#FF3366';
    endColor = '#FF8C00';
  } else if (score < 75) {
    startColor = '#FFA500';
    endColor = '#FFD700';
  }

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeWrapper}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Defs>
            <LinearGradient id={`grad-${score}`} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={startColor} />
              <Stop offset="1" stopColor={endColor} />
            </LinearGradient>
          </Defs>
          <G rotation={135} origin="40, 40">
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcLength} ${gap}`}
              strokeLinecap="round"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={`url(#grad-${score})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${progressLength} ${circumference}`}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View style={styles.gaugeInner}>
           <IconCmp size={16} color="rgba(255,255,255,0.7)" style={{ marginBottom: -4 }} />
           <Typography style={styles.gaugeScore}>{score}</Typography>
        </View>
        <Typography style={styles.gaugeMax}>100</Typography>
      </View>
    </View>
  );
};

interface ThemeProps {
  title: string;
  paragraph1: string;
  paragraph2: string;
  refText1: string;
  refText2: string;
}

export const ThemeCard: React.FC<ThemeProps> = ({
  title,
  paragraph1,
  paragraph2,
  refText1,
  refText2,
  score,
  iconName,
  suggestions
}) => {
  const [showRefs, setShowRefs] = useState(false);
  const [showSugs, setShowSugs] = useState(false);

  return (
    <View style={styles.cardContainer}>
      <BlurView intensity={20} tint="dark" style={styles.glassCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Typography variant="h3" style={styles.title}>{title}</Typography>
          </View>
          {score !== undefined && (
            <ScoreGauge score={score} iconName={iconName} label={title} />
          )}
        </View>
        
        <View style={styles.divider} />

        <Typography style={styles.paragraph1}>{paragraph1}</Typography>
        
        <Typography variant="caption" style={styles.paragraph2}>
          {paragraph2}
        </Typography>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.refButton} 
            onPress={() => setShowRefs(true)}
            activeOpacity={0.7}
          >
            <Typography variant="caption" style={styles.refText}>REFERÊNCIAS</Typography>
          </TouchableOpacity>

          {suggestions && suggestions.length > 0 && (
            <TouchableOpacity 
              style={[styles.refButton, styles.sugButton]} 
              onPress={() => setShowSugs(true)}
              activeOpacity={0.7}
            >
              <Typography variant="caption" style={styles.sugText}>OPTIMIZAÇÃO</Typography>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {/* REFS MODAL */}
      <Modal visible={showRefs} transparent animationType="fade">
        <BlurView intensity={60} tint="dark" style={styles.refModalFullscreen}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            onPress={() => setShowRefs(false)} 
            activeOpacity={1}
          />
          <View style={styles.refModalCentered}>
            <View style={styles.refModal}>
              <Typography style={styles.refModalContent1}>
                {refText1}
              </Typography>
              <Typography variant="caption" style={styles.refModalContent2}>
                {refText2}
              </Typography>
              <TouchableOpacity 
                style={styles.refCloseBtn} 
                onPress={() => setShowRefs(false)}
              >
                <Typography style={styles.refCloseText}>FECHAR</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* SUGGESTIONS MODAL */}
      <Modal visible={showSugs} transparent animationType="fade">
        <BlurView intensity={60} tint="dark" style={styles.refModalFullscreen}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            onPress={() => setShowSugs(false)} 
            activeOpacity={1}
          />
          <View style={styles.refModalCentered}>
            <View style={[styles.refModal, { borderColor: 'rgba(0, 255, 149, 0.3)' }]}>
              <Typography variant="h3" style={{ color: '#00FF9D', marginBottom: 16 }}>Sugestões</Typography>
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {suggestions?.map((sug, i) => (
                  <View key={i} style={{ marginBottom: 16 }}>
                    <Typography style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, marginBottom: 4 }}>• {sug.title}</Typography>
                    <Typography style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 }}>{sug.desc}</Typography>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={[styles.refCloseBtn, { backgroundColor: 'rgba(0, 255, 149, 0.1)', marginTop: 8 }]} 
                onPress={() => setShowSugs(false)}
              >
                <Typography style={[styles.refCloseText, { color: '#00FF9D' }]}>FECHAR</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  glassCard: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    color: '#00F2FF',
    letterSpacing: -0.5,
    fontSize: 20,
    fontWeight: '700',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    top: 4,
  },
  gaugeScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  gaugeMax: {
    position: 'absolute',
    bottom: 2,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  paragraph1: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 12,
  },
  paragraph2: {
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  refButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  refText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 10,
  },
  sugButton: {
    backgroundColor: 'rgba(0, 255, 149, 0.05)',
    borderColor: 'rgba(0, 255, 149, 0.2)',
  },
  sugText: {
    color: '#00FF9D',
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 10,
  },
  refModalFullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Dim it a bit under the blur
  },
  refModalCentered: {
    width: '85%',
    maxWidth: 400,
  },
  refModal: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(10, 15, 25, 0.85)',
  },
  refModalContent1: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
    lineHeight: 22,
    fontSize: 14,
    marginBottom: 16,
  },
  refModalContent2: {
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
    fontSize: 12,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  refCloseBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
  },
  refCloseText: {
    color: '#00F2FF',
    fontSize: 12,
    fontWeight: '700',
  }
});
