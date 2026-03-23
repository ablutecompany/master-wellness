import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Polyline, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Typography } from './Base';
import { Activity, Zap, Target, Heart, Moon, X } from 'lucide-react-native';

// ── Historical data (8 sessions, chronological) ──────────────────────────────
const DATES = ['29 Jan', '5 Fev', '12 Fev', '19 Fev', '26 Fev', '5 Mar', '12 Mar', '19 Mar'];

interface ThemeLine {
  title: string;
  shortTitle: string;
  color: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  data: number[]; // values normalized to 0–100 scale for the combined chart
}

const LINES: ThemeLine[] = [
  {
    title: 'Performance & Equilíbrio',
    shortTitle: 'Performance',
    color: '#00F2FF',
    Icon: Activity,
    data: [80, 84, 81, 87, 86, 83, 89, 88],
  },
  {
    title: 'Energia & Disponibilidade',
    shortTitle: 'Energia',
    color: '#FFA500',
    Icon: Zap,
    data: [67, 70, 74, 69, 73, 71, 75, 72],
  },
  {
    title: 'Potencial',
    shortTitle: 'Potencial',
    color: '#00D4AA',
    Icon: Target,
    data: [88, 91, 93, 90, 94, 92, 96, 95],
  },
  {
    title: 'Resistência saudável',
    shortTitle: 'Resistência',
    color: '#73BCFF',
    Icon: Heart,
    data: [76, 79, 77, 82, 80, 78, 83, 81],
  },
  {
    title: 'Recuperação',
    shortTitle: 'Recuperação',
    color: '#FF6060',
    Icon: Moon,
    data: [52, 49, 47, 50, 44, 48, 43, 45],
  },
  {
    title: 'Idade muscular',
    shortTitle: 'Idade muscular',
    color: '#C084FC',
    Icon: Activity,
    // Age ~35, expressed as percentage vitality: (45 - age) / 15 * 100
    // 35yo → 67, 36yo → 60 — keeps it on same chart scale
    data: [60, 60, 67, 60, 67, 60, 67, 67],
  },
];

// ── Chart constants ───────────────────────────────────────────────────────────
const PAD_LEFT = 28;  // Y-axis labels
const PAD_RIGHT = 28; // icon space
const PAD_TOP = 8;
const PAD_BOTTOM = 28; // X-axis date labels
const CHART_H = 260;

interface CombinedChartProps {
  width: number;
}

const CombinedChart: React.FC<CombinedChartProps> = ({ width }) => {
  const innerW = width - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const n = LINES[0].data.length;

  const toX = (i: number) => PAD_LEFT + (i / (n - 1)) * innerW;
  const toY = (v: number) => PAD_TOP + (1 - v / 100) * innerH;

  // Y-axis grid values
  const gridValues = [25, 50, 75, 100];
  // Show 3 date labels: first, middle, last
  const dateLabelIdx = [0, Math.floor(n / 2), n - 1];

  return (
    <View style={{ width, height: CHART_H, position: 'relative' }}>
      <Svg width={width} height={CHART_H}>
        {/* Grid lines */}
        {gridValues.map((v) => (
          <G key={v}>
            <Line
              x1={PAD_LEFT}
              y1={toY(v)}
              x2={PAD_LEFT + innerW}
              y2={toY(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={PAD_LEFT - 4}
              y={toY(v) + 3}
              fontSize={8}
              fill="rgba(255,255,255,0.22)"
              textAnchor="end"
              fontWeight="600"
            >
              {v}
            </SvgText>
          </G>
        ))}

        {/* Baseline */}
        <Line
          x1={PAD_LEFT}
          y1={toY(0)}
          x2={PAD_LEFT + innerW}
          y2={toY(0)}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />

        {/* Date labels */}
        {dateLabelIdx.map((i) => (
          <SvgText
            key={i}
            x={toX(i)}
            y={CHART_H - 4}
            fontSize={8}
            fill="rgba(255,255,255,0.28)"
            textAnchor="middle"
            fontWeight="600"
          >
            {DATES[i]}
          </SvgText>
        ))}

        {/* One polyline per theme */}
        {LINES.map((line) => {
          const pts = line.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
          return (
            <Polyline
              key={line.title}
              points={pts}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}

        {/* End dot per theme */}
        {LINES.map((line) => {
          const lastVal = line.data[n - 1];
          return (
            <Circle
              key={line.title + '_dot'}
              cx={toX(n - 1)}
              cy={toY(lastVal)}
              r={3.5}
              fill={line.color}
            />
          );
        })}
      </Svg>

      {/* Icons at end of each line — positioned absolutely */}
      {LINES.map((line) => {
        const lastVal = line.data[n - 1];
        const iconY = PAD_TOP + (1 - lastVal / 100) * innerH - 10;
        return (
          <View
            key={line.title + '_icon'}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: PAD_LEFT + innerW + 6,
              top: iconY,
            }}
          >
            <line.Icon size={16} color={line.color} />
          </View>
        );
      })}
    </View>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
}

export const HistoricoModal: React.FC<Props> = ({ visible, onClose }) => {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 32, 460);
  const chartW = cardW - 48;

  const overlayExtras = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={[styles.overlay, overlayExtras]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <View style={[styles.card, { width: cardW }]}>
          <View style={styles.header}>
            <View>
              <Typography style={styles.headerTitle}>HISTÓRICO</Typography>
              <Typography style={styles.headerSub}>Últimas 8 análises · todos os temas</Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <CombinedChart width={chartW} />

            {/* Explanatory caption */}
            <Typography style={styles.chartCaption}>
              Considera-se que 100 é a melhor informação possível. Por volta de 50: temos espaço para melhorar. Zero; as coisas não estão bem ou merecem atenção.
            </Typography>

            <View style={styles.divider} />
            <View style={styles.legend}>
              {LINES.map((line) => (
                <View key={line.title} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: line.color }]} />
                  <line.Icon size={12} color={line.color} />
                  <Typography style={[styles.legendText, { color: line.color }]}>
                    {line.shortTitle}
                  </Typography>
                  <Typography style={styles.legendValue}>
                    {line.data[line.data.length - 1]}
                  </Typography>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    maxHeight: '88%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(5,10,20,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 14,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 3,
    fontStyle: 'italic',
  },
  closeBtn: { padding: 4 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  chartCaption: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  // Legend
  legend: {
    paddingTop: 4,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  legendValue: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
