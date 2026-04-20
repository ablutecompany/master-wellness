import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Typography } from './Base';
import { DailySynthesis, selectPriorityChange, WeeklyBriefing } from '../store/selectors';
import { useStore } from '../store/useStore';
import { Lock, Database, AlertCircle, Calendar, Activity } from 'lucide-react-native';

const getColors = (status: string) => {
    switch (status) {
        case 'excellent': return { main: '#00D4AA', bg: 'rgba(0,212,170,0.3)', faint: 'rgba(0,212,170,0.1)' };
        case 'good': return { main: '#00F2FF', bg: 'rgba(0,242,255,0.3)', faint: 'rgba(0,242,255,0.1)' };
        case 'needs_attention': return { main: '#FFA500', bg: 'rgba(255,165,0,0.3)', faint: 'rgba(255,165,0,0.1)' };
        case 'critical': return { main: '#FF6060', bg: 'rgba(255,96,96,0.3)', faint: 'rgba(255,96,96,0.1)' };
        default: return { main: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.1)', faint: 'rgba(255,255,255,0.05)' };
    }
};

/**
 * ── SynthesisActionCard ────────────────────────────────────────────────────────
 * Primary central briefing block (floating) for Home, or inline mode elsewhere.
 */
interface ActionCardProps {
   synthesis: DailySynthesis | null;
   onAction: (intent: string) => void;
   style?: StyleProp<ViewStyle>;
}

export const SynthesisActionCard: React.FC<ActionCardProps> = ({ synthesis, onAction, style }) => {
   const priorityChange = useStore((state: any) => selectPriorityChange(state));
   if (!synthesis || synthesis.action.intent === 'wait') return null;
   const c = getColors(synthesis.status);

   return (
      <View style={[{ padding: 20, borderRadius: 24, backgroundColor: 'rgba(5, 10, 18, 0.95)', borderWidth: 1, borderColor: c.bg, overflow: 'hidden' }, style]}>
         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.main, marginRight: 8, opacity: 0.8 }} />
            <Typography style={{ color: c.main, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', flex: 1 }}>
               {synthesis.title}
            </Typography>
            {priorityChange && (priorityChange.priority === 'relevant' || priorityChange.priority === 'critical') && (
               <View style={{ backgroundColor: priorityChange.priority === 'critical' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(255, 165, 0, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                 <Typography style={{ color: priorityChange.priority === 'critical' ? '#FF3366' : '#FFA500', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>Mudança Principal • {priorityChange.domainLabel}</Typography>
               </View>
            )}
         </View>
         
         {synthesis.positiveHighlight && (
            <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18, marginBottom: 4 }}>
               {synthesis.positiveHighlight}
            </Typography>
         )}
         {synthesis.negativeHighlight && (
            <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 16, marginBottom: 16, fontStyle: 'italic' }}>
               {synthesis.negativeHighlight}
            </Typography>
         )}
         {!synthesis.negativeHighlight && <View style={{ height: 16 }} />}

         <TouchableOpacity 
            onPress={() => onAction(synthesis.action.intent)}
            style={{
               alignSelf: 'stretch', alignItems: 'center',
               paddingVertical: 12, borderRadius: 16, 
               backgroundColor: 'rgba(255,255,255,0.05)',
               borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
            }}
         >
            <Typography style={{ color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
               {synthesis.action.label}
            </Typography>
         </TouchableOpacity>
      </View>
   );
};

/**
 * ── StateSurface ─────────────────────────────────────────────────────────────
 * Unifies Restricted, No Data, Very Stale full block panels used inside drawers.
 */
interface EmptyStateSurfaceProps {
   type: 'restricted' | 'no_data' | 'insufficient';
   color?: string;
   title: string;
   description: string;
   actionLabel?: string;
   actionIntent?: string;
   onAction?: (intent: string) => void;
   style?: StyleProp<ViewStyle>;
}

export const StateSurface: React.FC<EmptyStateSurfaceProps> = ({ type, color = 'rgba(255,255,255,0.4)', title, description, actionLabel, actionIntent, onAction, style }) => {
   const renderIcon = () => {
      if (type === 'restricted') return <Lock size={20} color={color} />;
      if (type === 'no_data') return <Database size={20} color={color} />;
      return <AlertCircle size={20} color={color} />;
   };

   return (
       <View style={[{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 30, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }, style]}>
           <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: `${color}30` }}>
              {renderIcon()}
           </View>
           <Typography style={{ color: color, fontSize: 13, fontWeight: '800', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>{title}</Typography>
           <Typography style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: actionLabel ? 24 : 0 }}>{description}</Typography>

           {actionLabel && actionIntent && onAction && (
              <TouchableOpacity 
                 onPress={() => onAction(actionIntent)}
                 style={{ backgroundColor: `${color}10`, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: `${color}30` }}
              >
                 <Typography style={{ color: color, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>{actionLabel}</Typography>
              </TouchableOpacity>
           )}
       </View>
   );
};


export interface WeeklyBriefingCardProps {
    briefing: WeeklyBriefing | null;
    onAction: (intent: string) => void;
    style?: StyleProp<ViewStyle>;
}

export const WeeklyBriefingCard: React.FC<WeeklyBriefingCardProps> = ({ briefing, onAction, style }) => {
   if (!briefing) return null;
   const c = getColors(briefing.status);

   return (
      <View style={[{ padding: 20, borderRadius: 24, backgroundColor: 'rgba(5, 10, 18, 0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }, style]}>
         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Calendar size={14} color='rgba(255,255,255,0.4)' style={{ marginRight: 8 }} />
            <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
               Ciclo Biogr�fico Curto (7d)
            </Typography>
         </View>

         <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Activity size={12} color='rgba(255,255,255,0.2)' style={{ marginTop: 2, marginRight: 8 }} />
            <Typography style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, flex: 1 }}>{briefing.stabilityLabel}</Typography>
         </View>

         {briefing.changeLabel && (
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
               <AlertCircle size={12} color={c.main} style={{ marginTop: 2, marginRight: 8 }} />
               <Typography style={{ color: '#fff', fontSize: 13, lineHeight: 18, flex: 1, fontWeight: '500' }}>{briefing.changeLabel}</Typography>
            </View>
         )}

         {briefing.gapLabel && (
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
               <AlertCircle size={12} color='rgba(255,255,255,0.2)' style={{ marginTop: 2, marginRight: 8 }} />
               <Typography style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 16, flex: 1, fontStyle: 'italic' }}>{briefing.gapLabel}</Typography>
            </View>
         )}
         
         <TouchableOpacity 
            onPress={() => onAction(briefing.action.intent)}
            style={{
               alignSelf: 'flex-start',
               paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, 
               backgroundColor: 'rgba(255,255,255,0.05)',
               borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
            }}
         >
            <Typography style={{ color: 'white', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
               {briefing.action.label}
            </Typography>
         </TouchableOpacity>
      </View>
   );
};

