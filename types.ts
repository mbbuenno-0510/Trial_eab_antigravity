
// src/types.ts

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

/**
 * Tipo correto e seguro para timestamps do Firestore.
 * Garante que o TypeScript reconheça o objeto Timestamp do Firebase.
 */
export type FirestoreTimestamp = firebase.firestore.Timestamp; 

// --- TIPOS DE PERFIL E USUÁRIO ---
export enum ProfileType {
  CHILD = 'CHILD',
  ADULT = 'ADULT',
  PROFESSIONAL = 'Health',
  SCHOOL = 'School'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string; // Adicionado para compatibilidade com WelcomeCard
  profileType: ProfileType | null; // Null para Adulto Independente, 'Health' para Profissional, 'CHILD' para Criança
  photoURL?: string;
  
  // Dados Profissionais
  professionalId?: string; // Legacy or Combined string (CRM/CRP 12345)
  professionalCouncil?: string; // Novo: CRM, CRP, etc.
  professionalCode?: string;    // Novo: Número do registro
  linkedProfessionalId?: string; // ID do médico
  
  // Dados Escola
  cnpj?: string; // Novo: CNPJ da Escola para validação de acesso

  // Campos específicos para perfil Criança com Responsável
  guardianName?: string;
  guardianPin?: string; 
  
  // Campos de Linkagem
  manages?: string[]; 
  linkedGuardianId?: string; 
  childLoginEmail?: string; 
  childUsername?: string; 
  childPassword?: string;
}

// --- REGRAS DE ACESSO AO PERFIL ---
export interface HealthAccessRule {
  council: string;
  code: string;
}

export interface SchoolAccessRule {
  cnpj: string;
  name?: string; // Nome amigável para identificar na lista (Ex: "Escola X")
}

// --- PERFIL ESTENDIDO DA CRIANÇA (DocsView) ---
export interface ChildExtendedProfile {
  cpf?: string; 
  childName?: string; 
  birthDate?: string; // YYYY-MM-DD
  
  // Nível de Suporte TEA
  teaLevel?: '1' | '2' | '3'; // 1 (Leve), 2 (Moderado), 3 (Severo)

  // Configurações da Sala da Calma (Habilitar/Desabilitar ferramentas)
  sensoryConfig?: {
    allowBreath: boolean;
    allowSound: boolean;
    allowFidget: boolean;
    allowStories: boolean;
    allowPiano: boolean;
    allowGenius: boolean;
    // Novas ferramentas para faixas etárias variadas
    allowColors: boolean;      // 0-4 anos
    allowAnimals: boolean;     // 0-6 anos
    allowDrawing: boolean;     // 5+ anos
    allowMeditation: boolean;  // 8+ anos
    // Recursos de Comunicação e Alfabetização
    allowCommunication?: boolean; // Painel AAC
    allowSocialStories?: boolean; // Histórias Sociais
    allowLiteracy?: boolean;      // Leitura Mágica
    allowStoryCubes?: boolean;    // Dados de Histórias
    allowAsmr?: boolean;          // Sons ASMR
  };

  sensoryPreferences: string;
  discomfortItems: string;
  favorites: string;
  vocabulary: string; 
  communicationMethods: string; 
  preferredRoutines: string;
  
  isVisibleToChild: boolean; 
  
  // Controle de Notificações e Visibilidade Pai
  notifyGuardianOnCalmRoomEnter?: boolean; 
  showSchoolHistoryToGuardian?: boolean; // Novo: Permite o pai ver o histórico escolar na aba Diário
  
  // Controle de Documentos
  shareMedicalDocsWithHealth?: boolean; 
  
  // Controle de Profissionais de Saúde (Global - Pai define quem entra)
  isVisibleToHealth?: boolean; 
  allowedHealthProfessionals?: HealthAccessRule[]; 

  // Controle de Compartilhamento Interdisciplinar (Profissional define com quem compartilha)
  // Key: UID do profissional logado (autor) -> Value: Lista de conselhos/códigos com quem ele compartilha SEUS dados
  interProfessionalSharing?: Record<string, HealthAccessRule[]>;

  // Controle de Escolas
  isVisibleToSchool?: boolean;
  allowedSchools?: SchoolAccessRule[]; 
}


// --- DIÁRIO DE HUMOR ---
export enum MoodType {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  ANXIOUS = 'ANXIOUS',
  CALM = 'CALM',
  TIRED = 'TIRED'
}

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: number | Date | FirestoreTimestamp; 
  mood: MoodType;
  notes: string;
  aiFeedback?: string;
  period: 'Manhã' | 'Tarde' | 'Noite';
  dateString?: string; // YYYY-MM-DD
}

// --- DIÁRIO COMPORTAMENTAL (PAIS) ---
export type BehaviorEventType = 'CRISIS' | 'FOOD' | 'SLEEP' | 'HYPERFOCUS' | 'TRIGGER' | 'REINFORCER';
export type CrisisIntensity = 'LEVE' | 'MODERADA' | 'INTENSA';

export interface BehaviorEntry {
  id: string;
  userId: string; 
  authorId: string; 
  timestamp: number | Date | FirestoreTimestamp;
  dateString: string; // YYYY-MM-DD
  type: BehaviorEventType;
  intensity?: CrisisIntensity; 
  description?: string; 
  duration?: string; 
  period: 'Manhã' | 'Tarde' | 'Noite';
}


// --- MEDICAMENTOS ---
export const DOSAGE_UNITS = ['mg', 'ml', 'cp', 'gotas', 'g', 'mcg', 'ui'];
export type FrequencyType = 'daily' | 'specific_days';

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosageValue: number;
  dosageUnit: string; 
  category?: string;
  stock: number;
  minStock: number;
  frequencyType: FrequencyType;
  selectedDays?: number[]; 
  administrationTimes: string[]; 
  packageSize?: number;
  packageUnit?: string;

  altoCusto?: boolean;
  dataRetirada?: string;
  horaRetirada?: string;
  professionalName?: string;
  administeredAtSchool?: boolean;
  instructions?: string; 
  altoCustoInstructions?: string; 

  downloadUrl?: string | null; 
  storagePath?: string | null; 
  
  attachmentBase64?: string | null; 
  attachmentFilename?: string | null; 
  attachmentMimeType?: string | null; 
}


// --- AGENDAMENTOS E TERAPIAS ---
export interface Appointment {
  id: string;
  userId: string;
  title: string; 
  specialty: string;
  date: string; 
  time?: string; 
  alarmTime?: string; 
  notes?: string;
  
  isRecurrent?: boolean;
  schedule?: string;
  name?: string; 
  dayOfWeek?: number; 
  timestamp?: number; 

  professionalName?: string;
  professionalCouncil?: string;
  professionalCode?: string;
}

export interface TherapyTask {
  id: string;
  description: string; 
  isCompleted: boolean;
}

export interface Therapy {
  id: string;
  userId: string;
  name: string;
  dayOfWeek: number; 
  time: string;
  alarmTime?: string;
  professional?: string; 
  specialty?: string;

  professionalName?: string;
  professionalCouncil?: string;
  professionalCode?: string;

  tasks?: TherapyTask[]; 
}


// --- DOCUMENTOS ---
export interface StoredDocument {
  id: string;
  userId: string;
  title: string;
  category: string;
  mimeType: string; 
  filename: string;
  dataUrl?: string; 
  downloadUrl?: string; 
  storagePath?: string; 
  uploadedAt: number | Date | FirestoreTimestamp; 
  uploaderId?: string;
  sharedWithHealth?: boolean; // Novo: Controle individual de compartilhamento com profissionais de saúde
  documentDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
}


// --- ROTINAS E LOGS ---
export type Period = 'Manhã' | 'Tarde' | 'Noite';
export const PERIODS: Period[] = ['Manhã', 'Tarde', 'Noite'];

export type RoutineFrequency = 'Diário' | 'Semanal' | 'Mensal' | 'Ocasional';

export interface RoutineItem {
  id: string;
  userId: string;
  title: string;
  type: 'house' | 'school';
  frequency: RoutineFrequency;
  selectedDays?: number[]; 
  period: Period;
  lastCompletedDate: string | null; 
  icon?: string;
}

export interface RoutineLog {
  id: string;
  routineId: string;
  userId: string;
  title: string;
  date: string; 
  status: 'completed' | 'skipped' | 'missed'; 
  type: 'house' | 'school';
  period?: Period;
  icon?: string;
}

// --- METAS E RECOMPENSAS ---
export interface GoalConfig {
  targetPercentageDaily: number; 
  rewardTextDaily: string; 
  targetPercentageWeekly: number; 
  rewardTextWeekly: string; 
  isEnabled: boolean;
  isWeeklyEnabled?: boolean;
}

export interface DailyRewardHistory {
  date: string; 
  achievedPercentage: number;
  targetPercentage: number;
  goalWasMet: boolean; 
  rewardClaimed: boolean; 
  rewardText: string;
}

// --- MÓDULO TERAPÊUTICO ---
export type GoalType = 'PEI' | 'PTI' | 'Semanal' | 'Geral';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface TherapeuticGoal {
  id: string;
  userId: string; 
  professionalId: string; 
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  createdAt: number | Date | FirestoreTimestamp;
  deadline?: string; 
}

export interface SessionLog {
  id: string;
  userId: string; 
  professionalId: string;
  date: string; 
  timestamp: number | Date | FirestoreTimestamp;
  tags: string[]; 
  notes?: string;
  moodRating?: 'Bom' | 'Regular' | 'Difícil';
}

// --- MÓDULO ESCOLAR ---
export interface SchoolLog {
  id: string;
  userId: string; 
  schoolId: string; 
  date: string; 
  timestamp: number | Date | FirestoreTimestamp;
  socialInteraction: 'Baixa' | 'Média' | 'Alta';
  participation: 'Baixa' | 'Média' | 'Alta';
  dysregulationCount: number; 
  dysregulationDetails?: string; 
  successfulStrategies?: string; 
  generalNotes?: string;
}

export interface SchoolMedicationLog {
  id: string;
  userId: string; 
  schoolId: string; 
  medicationId: string;
  medicationName: string;
  dosage: string;
  date: string; 
  time: string; 
  administeredAt: string; 
  timestamp: number | Date | FirestoreTimestamp;
  notes?: string;
}
