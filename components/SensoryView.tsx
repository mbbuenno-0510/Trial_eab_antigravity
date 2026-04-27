
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Wind, Music, Sparkles, BookOpen, Play, Square, Volume2, ArrowLeft, Waves, VolumeX, Volume1, Loader2, Gamepad2, Palette, Dog, PenTool, BrainCircuit, Cloud, TreePine, Droplets, MessageCircle, BookOpenCheck, Grid, RefreshCw, Mic, MicOff, X, Trash2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ChildExtendedProfile } from '../types';
import CalmPiano from './CalmPiano';
import SimonGame from './SimonGame';
import StoryCubes from './StoryCubes';

// --- CONFIGURAÇÕES DE DADOS E CONSTANTES ---
const INITIAL_MASTER_VOLUME = 1.0; 
const BREATH_CYCLE = {
    IN: 4, 
    HOLD: 1.5,
    OUT: 5.5,
    TOTAL: 12,
    MAX_VOLUME: 0.8,
    BREATH_FREQ: 350 
};

const STORIES_DATA = [
    { text: "Quando estou bravo, eu posso contar até 10, respirar fundo e pedir um abraço para me acalmar. Eu consigo!", icon: "😡 ➡️ 😌", title: "A Calma da Tartaruga" },
    { text: "Tudo bem pedir um tempo e ir para um lugar silencioso quando minhas emoções estão muito fortes. Eu me sinto melhor lá.", icon: "✋ 🕒", title: "O Cantinho Seguro" },
    { text: "Eu sou corajoso e consigo me acalmar. Eu sou como um super-herói das minhas emoções, forte e tranquilo.", icon: "🦁 ❤️", title: "O Super-Herói das Emoções" },
    { text: "Respirar fundo me ajuda a relaxar o corpo e a mente. É como apertar o botão de pausa no meu dia.", icon: "🌬️ 🍃", title: "O Botão de Pausa" },
    { text: "Quando sinto que algo me incomoda, posso desenhar o que sinto ou conversar com alguém que confio.", icon: "✏️ 🗣️", title: "Minhas Ferramentas de Calma" },
    { text: "Um abraço apertado ou segurar a mão de alguém que me ama me ajuda a sentir segurança e paz.", icon: "🫂 🤝", title: "O Poder do Abraço" },
    { text: "Fecho meus olhos e imagino um lugar feliz, como uma praia ensolarada ou um campo florido. Isso me acalma.", icon: "☀️ 🏖️", title: "Meu Lugar Secreto de Paz" },
    { text: "É normal ter sentimentos grandes. Eu aprendo a entende-los e a ser gentil comigo mesmo. Eu sou incrível!", icon: "💖 ✨", title: "Gentileza Comigo Mesmo" }
];

const MEDITATION_THEMES = [
    {
        id: 'balloon',
        title: 'O Balão Mágico',
        description: 'Flutue levemente no céu azul',
        icon: <Cloud className="w-8 h-8 text-sky-500" />,
        color: 'bg-sky-50 border-sky-200',
        prompt: (childAge: number) => childAge < 8 
            ? "Diga com voz suave, lenta e encantadora, como uma fada madrinha: 'Vamos fazer uma viagem mágica. Feche os olhos. Imagine que você é um balão bem levinho. Respire fundo... e solte o ar devagar. Você está subindo no céu azul, flutuando entre as nuvens fofinhas. Sinta o vento no seu rosto. Tudo é calmo aqui em cima. Você está seguro e relaxado.'"
            : "Diga com voz calma, profunda e relaxante: 'Sente-se confortavelmente. Feche os olhos e imagine um balão azul subindo ao céu. A cada respiração, você se sente mais leve, deixando as preocupações no chão. O balão sobe suavemente, levado por uma brisa tranquila. Sinta a liberdade e a paz deste momento.'"
    },
    {
        id: 'tree',
        title: 'A Árvore Forte',
        description: 'Sinta suas raízes e força',
        icon: <TreePine className="w-8 h-8 text-emerald-600" />,
        color: 'bg-emerald-50 border-emerald-200',
        prompt: (childAge: number) => "Diga com voz calma, lenta e firme: 'Imagine que você é uma árvore grande e forte na floresta. Seus pés são raízes poderosas que entram na terra. Você é firme e nada te derruba. Respire fundo e sinta a força da terra subindo pelos seus pés. Estique os braços como galhos em direção ao sol. Você é forte, seguro e tranquilo.'"
    },
    {
        id: 'ocean',
        title: 'Onda do Mar',
        description: 'O ritmo calmo das ondas',
        icon: <Droplets className="w-8 h-8 text-blue-600" />,
        color: 'bg-blue-50 border-blue-200',
        prompt: (childAge: number) => "Diga com voz de narrador de relaxamento, fazendo pausas longas: 'Vamos respirar como as ondas do mar. Feche os olhos. Quando o ar entra, a onda sobe na areia. Quando o ar sai, a onda desce. Inspire... onda subindo. Expire... onda descendo. O barulho do mar te acalma. O mar é grande e abraça seus pensamentos, levando tudo o que te incomoda embora.'"
    }
];

// Dados para o Painel de Escolhas (AAC)
const CHOICE_BOARD_DATA = {
    categories: [
        { id: 'food', label: 'Comer', icon: '🍎', color: 'bg-red-100 border-red-300' },
        { id: 'drink', label: 'Beber', icon: '🥤', color: 'bg-blue-100 border-blue-300' },
        { id: 'play', label: 'Brincar', icon: '⚽', color: 'bg-green-100 border-green-300' },
        { id: 'feel', label: 'Sentir', icon: '😊', color: 'bg-yellow-100 border-yellow-300' },
        { id: 'actions', label: 'Ações', icon: '🙌', color: 'bg-purple-100 border-purple-300' }
    ],
    items: {
        food: [
            { label: 'Maçã', icon: '🍎' }, { label: 'Banana', icon: '🍌' }, { label: 'Biscoito', icon: '🍪' }, 
            { label: 'Pão', icon: '🍞' }, { label: 'Uva', icon: '🍇' }, { label: 'Chocolate', icon: '🍫' }
        ],
        drink: [
            { label: 'Água', icon: '💧' }, { label: 'Suco', icon: '🧃' }, { label: 'Leite', icon: '🥛' }, { label: 'Refrigerante', icon: '🥤' }
        ],
        play: [
            { label: 'Bola', icon: '⚽' }, { label: 'Boneco', icon: '🧸' }, { label: 'Tablet', icon: '📱' }, 
            { label: 'Desenhar', icon: '🖍️' }, { label: 'Correr', icon: '🏃' }, { label: 'Blocos', icon: '🧱' }
        ],
        feel: [
            { label: 'Feliz', icon: '😊' }, { label: 'Triste', icon: '😢' }, { label: 'Bravo', icon: '😠' }, 
            { label: 'Cansado', icon: '😴' }, { label: 'Dor', icon: '🤕' }, { label: 'Fome', icon: '😋' }
        ],
        actions: [
            { label: 'Quero', icon: '🤲' }, { label: 'Não Quero', icon: '🚫' }, { label: 'Banheiro', icon: '🚽' }, 
            { label: 'Dormir', icon: '🛌' }, { label: 'Ajuda', icon: '🆘' }, { label: 'Sim', icon: '👍' }, { label: 'Não', icon: '👎' }
        ]
    }
};

const SOCIAL_SCENARIOS = [
    { id: 'doctor', title: 'Ir ao Médico', icon: '🩺', prompt: "Crie uma história social curta, positiva e reconfortante para uma criança autista sobre ir ao médico. Foco: o médico é amigo e ajuda a cuidar da saúde. Narrativa em primeira pessoa." },
    { id: 'haircut', title: 'Cortar o Cabelo', icon: '✂️', prompt: "Crie uma história social curta e positiva sobre cortar o cabelo. Foco: o barulho da tesoura é normal, sentar na cadeira e ficar bonito. Narrativa em primeira pessoa." },
    { id: 'sharing', title: 'Dividir Brinquedos', icon: '🧸', prompt: "Crie uma história social curta e amigável sobre dividir brinquedos. Foco: é legal emprestar, o brinquedo volta, brincar junto é divertido. Narrativa em primeira pessoa." },
    { id: 'school', title: 'Ir para a Escola', icon: '🎒', prompt: "Crie uma história social curta e animada sobre ir para a escola. Foco: ver amigos, aprender coisas novas e a rotina segura. Narrativa em primeira pessoa." },
    { id: 'loud_noises', title: 'Barulhos Altos', icon: '🎧', prompt: "Crie uma história social curta sobre barulhos altos. Foco: posso usar meus fones, respirar fundo e pedir ajuda. Estou seguro. Narrativa em primeira pessoa." },
    { id: 'routine_change', title: 'Mudança de Rotina', icon: '🔄', prompt: "Crie uma história social curta e calma sobre quando as coisas mudam. Foco: às vezes a rotina muda, mas está tudo bem. Eu sou flexível e seguro. Narrativa em primeira pessoa." }
];

// URLs CORRIGIDAS: Google CDN (MP3 Padrão - Alta Compatibilidade iOS/Android/Web)
const ANIMALS_DATA = [
    { name: 'Gato', icon: '🐱', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/cat.mp3', color: 'bg-orange-100 text-orange-800' },
    { name: 'Cachorro', icon: '🐶', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/dog.mp3', color: 'bg-amber-100 text-amber-800' },
    { name: 'Pássaro', icon: '🐦', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/robin.mp3', color: 'bg-sky-100 text-sky-800' },
    { name: 'Leão', icon: '🦁', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/lion.mp3', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Elefante', icon: '🐘', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/elephant.mp3', color: 'bg-slate-100 text-slate-800' },
    { name: 'Vaca', icon: '🐮', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/cow.mp3', color: 'bg-stone-100 text-stone-800' },
    { name: 'Cavalo', icon: '🐎', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/horse.mp3', color: 'bg-amber-50 text-amber-900' },
    { name: 'Ovelha', icon: '🐑', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/sheep.mp3', color: 'bg-gray-100 text-gray-800' },
    { name: 'Porco', icon: '🐷', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/pig.mp3', color: 'bg-pink-100 text-pink-800' },
    { name: 'Pato', icon: '🦆', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/duck.mp3', color: 'bg-yellow-50 text-yellow-700' },
    { name: 'Macaco', icon: '🐒', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/monkey.mp3', color: 'bg-stone-200 text-stone-800' },
    { name: 'Lobo', icon: '🐺', audioUrl: 'https://www.google.com/logos/fnbx/animal_sounds/wolf.mp3', color: 'bg-slate-200 text-slate-900' }
];

// --- UTILITÁRIOS DE ÁUDIO ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }); 

export class SoundGenerator {
    ctx: AudioContext | null = null;
    oscillators: any[] = [];
    gainNode: GainNode | null = null;
    currentLoop: any = null; 
    heartbeatInterval: any = null;
    masterGainNode: GainNode | null = null; 

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.masterGainNode && this.ctx) {
            this.masterGainNode = this.ctx.createGain();
            this.masterGainNode.connect(this.ctx.destination); 
            this.masterGainNode.gain.value = INITIAL_MASTER_VOLUME;
        }
        return this.ctx;
    }

    setMasterVolume(volume: number) { 
        this.init(); 
        if (this.masterGainNode && this.ctx) {
            this.masterGainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
        } 
    }

    stop() {
        this.oscillators.forEach(osc => { try { if (typeof osc.stop === 'function') osc.stop(); } catch (e) {} });
        this.oscillators = [];
        if (this.currentLoop !== null) { clearInterval(this.currentLoop); this.currentLoop = null; }
        if (this.heartbeatInterval !== null) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null; }
        if (this.gainNode) { try { this.gainNode.disconnect(); } catch(e) {} this.gainNode = null; }
    }

    playNote(frequency: number) {
        const ctx = this.init(); if (!ctx || !this.masterGainNode) return;
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); const time = ctx.currentTime; const duration = 1.5; 
        osc.frequency.setValueAtTime(frequency, time); osc.type = 'sine'; 
        gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(0.4, time + 0.05); gain.gain.exponentialRampToValueAtTime(0.0001, time + duration); 
        osc.connect(gain); gain.connect(this.masterGainNode);
        osc.start(time); osc.stop(time + duration);
    }

    playDrone() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.15; masterGain.connect(this.masterGainNode); this.gainNode = masterGain; 
        [220, 222, 164].forEach(freq => { const osc = ctx!.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq; osc.connect(masterGain); osc.start(); this.oscillators.push(osc); }); 
    }

    playWind() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.2; masterGain.connect(this.masterGainNode); this.gainNode = masterGain; 
        const bufferSize = ctx.sampleRate; const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const output = noiseBuffer.getChannelData(0); 
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; } 
        const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true; 
        const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.setValueAtTime(500, ctx.currentTime); filter.Q.setValueAtTime(0.5, ctx.currentTime); 
        noise.connect(filter); filter.connect(masterGain); noise.start(); this.oscillators.push(noise);
    }

    playRain() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.15; 
        const bufferSize = 2 * ctx.sampleRate; const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const output = noiseBuffer.getChannelData(0); 
        let lastOut = 0; for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; } 
        const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true; 
        noise.connect(masterGain); masterGain.connect(this.masterGainNode); noise.start(); this.oscillators.push(noise); this.gainNode = masterGain;
    }

    playHeartbeat() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 2.5; masterGain.connect(this.masterGainNode); this.gainNode = masterGain;
        const intervalSeconds = 1.2; let nextBeatTime = ctx.currentTime + 0.1; 
        const beat = () => { if (!this.ctx) return; const time = Math.max(this.ctx.currentTime, nextBeatTime);
            const osc1 = this.ctx.createOscillator(); const gain1 = this.ctx.createGain(); osc1.type = 'sine'; osc1.frequency.setValueAtTime(55, time); gain1.gain.setValueAtTime(0, time); gain1.gain.linearRampToValueAtTime(1.0, time + 0.05); gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.2); osc1.connect(gain1); gain1.connect(masterGain); osc1.start(time); osc1.stop(time + 0.25); 
            const osc2 = this.ctx.createOscillator(); const gain2 = this.ctx.createGain(); const time2 = time + 0.25; osc2.type = 'sine'; osc2.frequency.setValueAtTime(65, time2); gain2.gain.setValueAtTime(0, time2); gain2.gain.linearRampToValueAtTime(0.8, time2 + 0.05); gain2.gain.exponentialRampToValueAtTime(0.001, time2 + 0.2); osc2.connect(gain2); gain2.connect(masterGain); osc2.start(time2); osc2.stop(time2 + 0.25); nextBeatTime = time + intervalSeconds; }; 
        beat(); this.heartbeatInterval = setInterval(beat, intervalSeconds * 1000);
    }

    playWaves() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.2; masterGain.connect(this.masterGainNode); this.gainNode = masterGain;
        const bufferSize = ctx.sampleRate; const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const output = noiseBuffer.getChannelData(0); 
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; } 
        const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true; 
        const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(600, ctx.currentTime); filter.Q.setValueAtTime(1, ctx.currentTime); 
        const lfoGain = ctx.createGain(); const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.setValueAtTime(0.2, ctx.currentTime); lfoGain.gain.setValueAtTime(0.15, ctx.currentTime); lfo.connect(lfoGain); lfoGain.connect(masterGain.gain); 
        noise.connect(filter); filter.connect(masterGain); noise.start(); lfo.start(); this.oscillators.push(noise, lfo);
    }

    playCalmPiano() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.2; masterGain.connect(this.masterGainNode); this.gainNode = masterGain; 
        const notes = [130.81, 196.00, 164.81, 130.81]; let noteIndex = 0; const beatInterval = 2500; 
        const playNote = () => { if (!this.ctx || this.ctx.state === 'closed' || this.gainNode === null) return; 
            const freq = notes[noteIndex]; const time = this.ctx.currentTime; const duration = 2.0; 
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, time); gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(0.5, time + 0.1); gain.gain.exponentialRampToValueAtTime(0.0001, time + duration); osc.connect(gain); gain.connect(masterGain); osc.start(time); osc.stop(time + duration + 0.5); noteIndex = (noteIndex + 1) % notes.length; }; 
        playNote(); this.currentLoop = setInterval(playNote, beatInterval);
    }

    playPop() {
        const ctx = this.init(); if (!ctx || !this.masterGainNode) return; 
        const t = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = 400; osc.type = 'sine'; osc.connect(gain); gain.connect(this.masterGainNode); osc.start(t); gain.gain.exponentialRampToValueAtTime(0.00001, t + 0.1); osc.stop(t + 0.1);
    }

    playTibetanBell() {
        const ctx = this.init(); if (!ctx || !this.masterGainNode) return; 
        const t = ctx.currentTime; const osc = ctx.createOscillator(); const gain = ctx.createGain(); const duration = 2.0; osc.frequency.setValueAtTime(520, t); osc.type = 'sine'; gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration); osc.connect(gain); gain.connect(this.masterGainNode); osc.start(t); osc.stop(t + duration);
    }

    playAsmr(type: 'whisper' | 'tapping' | 'scratching' | 'mouth' | 'objects' | 'pages' | 'brushes' | 'medical' | 'spa' | 'fireplace' | 'writing' | 'rain') {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return;
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.3; masterGain.connect(this.masterGainNode); this.gainNode = masterGain;

        if (type === 'whisper') {
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
            const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 1;
            const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.5;
            const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.1; lfo.connect(lfoGain); lfoGain.connect(masterGain.gain);
            noise.connect(filter); filter.connect(masterGain); noise.start(); lfo.start();
            this.oscillators.push(noise, lfo);
        } else if (type === 'tapping') {
            const beat = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
                gain.gain.setValueAtTime(0.3, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.connect(gain); gain.connect(masterGain); osc.start(t); osc.stop(t + 0.1);
            };
            this.currentLoop = setInterval(beat, 400); beat();
        } else if (type === 'scratching') {
            const bufferSize = ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
            const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1500; filter.Q.value = 5;
            const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 4;
            const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.2; lfo.connect(lfoGain); lfoGain.connect(masterGain.gain);
            noise.connect(filter); filter.connect(masterGain); noise.start(); lfo.start();
            this.oscillators.push(noise, lfo);
        } else if (type === 'pages') {
            const beat = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime;
                const noise = this.ctx.createBufferSource();
                const bufferSize = this.ctx.sampleRate * 0.5;
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { output[i] = (Math.random() * 2 - 1) * Math.exp(-i / 2000); }
                noise.buffer = noiseBuffer;
                const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2000;
                noise.connect(filter); filter.connect(masterGain); noise.start(t);
            };
            this.currentLoop = setInterval(beat, 2000); beat();
        } else if (type === 'brushes') {
            const bufferSize = ctx.sampleRate * 4;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 0.1; }
            const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1200;
            const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.3;
            const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.2; lfo.connect(lfoGain); lfoGain.connect(masterGain.gain);
            noise.connect(filter); filter.connect(masterGain); noise.start(); lfo.start();
            this.oscillators.push(noise, lfo);
        } else if (type === 'medical') {
            const beat = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                osc.type = 'triangle'; osc.frequency.setValueAtTime(2000 + Math.random() * 500, t);
                gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.connect(gain); gain.connect(masterGain); osc.start(t); osc.stop(t + 0.05);
            };
            this.currentLoop = setInterval(beat, 1200); beat();
        } else if (type === 'spa') {
            const beat = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(100 + Math.random() * 50, t);
                gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
                osc.connect(gain); gain.connect(masterGain); osc.start(t); osc.stop(t + 0.8);
            };
            this.currentLoop = setInterval(beat, 1500); beat();
        } else if (type === 'fireplace') {
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
            const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
            noise.connect(filter); filter.connect(masterGain); noise.start(); this.oscillators.push(noise);
            const pops = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                osc.type = 'square'; osc.frequency.setValueAtTime(100 + Math.random() * 200, t);
                gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                osc.connect(gain); gain.connect(masterGain); osc.start(t); osc.stop(t + 0.02);
            };
            this.currentLoop = setInterval(() => { if (Math.random() > 0.7) pops(); }, 200);
        } else if (type === 'writing') {
            const beat = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime;
                const noise = this.ctx.createBufferSource();
                const bufferSize = this.ctx.sampleRate * 0.2;
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { output[i] = (Math.random() * 2 - 1) * 0.1; }
                noise.buffer = noiseBuffer;
                const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 4000;
                noise.connect(filter); filter.connect(masterGain); noise.start(t);
            };
            this.currentLoop = setInterval(() => { if (Math.random() > 0.4) beat(); }, 300);
        } else if (type === 'rain') {
            this.playRain();
        } else if (type === 'mouth') {
            const beat = () => {
                if (!this.ctx || this.gainNode === null) return;
                const t = this.ctx.currentTime + Math.random() * 0.1;
                const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(4000 + Math.random() * 2000, t);
                gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.connect(gain); gain.connect(masterGain); osc.start(t); osc.stop(t + 0.05);
            };
            this.currentLoop = setInterval(beat, 600); beat();
        } else if (type === 'objects') {
            const bufferSize = ctx.sampleRate * 3;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 0.5 - 0.25; }
            const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800;
            noise.connect(filter); filter.connect(masterGain); noise.start();
            this.oscillators.push(noise);
        }
    }

    playBreathingGuide() {
        const ctx = this.init(); this.stop(); if (!ctx || !this.masterGainNode) return; 
        const masterGain = ctx.createGain(); masterGain.gain.value = 0.5; masterGain.connect(this.masterGainNode); this.gainNode = masterGain; 
        const bufferSize = ctx.sampleRate * 2; const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const output = noiseBuffer.getChannelData(0); let lastOut = 0; for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; } 
        const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true; 
        const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 200; 
        const breathGain = ctx.createGain(); breathGain.gain.value = 0;
        noise.connect(filter); filter.connect(breathGain); breathGain.connect(masterGain); noise.start(); this.oscillators.push(noise); 
        const { IN, HOLD, OUT, TOTAL } = BREATH_CYCLE; const maxVol = BREATH_CYCLE.MAX_VOLUME;
        const scheduleCycle = () => { if (!this.ctx) return; let t = this.ctx.currentTime; breathGain.gain.cancelScheduledValues(t); breathGain.gain.setValueAtTime(0.01, t); breathGain.gain.linearRampToValueAtTime(maxVol, t + IN); filter.frequency.cancelScheduledValues(t); filter.frequency.setValueAtTime(150, t); filter.frequency.exponentialRampToValueAtTime(600, t + IN); breathGain.gain.setTargetAtTime(0, t + IN, 0.1); const exhaleStart = t + IN + HOLD; breathGain.gain.setValueAtTime(maxVol * 0.8, exhaleStart); breathGain.gain.exponentialRampToValueAtTime(0.01, exhaleStart + OUT); filter.frequency.setValueAtTime(500, exhaleStart); filter.frequency.exponentialRampToValueAtTime(100, exhaleStart + OUT); }; 
        scheduleCycle(); this.currentLoop = setInterval(scheduleCycle, TOTAL * 1000);
    }
}

export const soundGen = new SoundGenerator();

// --- COMPONENTES AUXILIARES ---

// ... (BreathingExercise, ColorLights, AnimalSounds, ZenDrawing mantidos iguais) ...
const CycleText = ({ setPhase }: { setPhase: (s: string) => void }) => {
    useEffect(() => {
        const cycle = () => {
            setPhase('Inspirar...');
            setTimeout(() => setPhase('Segurar...'), BREATH_CYCLE.IN * 1000); 
            setTimeout(() => setPhase('Soltar o ar...'), (BREATH_CYCLE.IN + BREATH_CYCLE.HOLD) * 1000); 
        };
        cycle(); const interval = setInterval(cycle, BREATH_CYCLE.TOTAL * 1000);
        return () => clearInterval(interval);
    }, [setPhase]);
    return null;
};

const BreathingExercise = () => {
    const [phase, setPhase] = useState('Inspirar'); 
    const [isStarted, setIsStarted] = useState(false);
    const startBreathing = () => { soundGen.init(); soundGen.playBreathingGuide(); setIsStarted(true); };
    useEffect(() => { return () => soundGen.stop(); }, []); 

    return (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-700">
            {!isStarted ? (
                <div className="text-center p-8 bg-blue-50 rounded-3xl border-2 border-blue-100 shadow-sm max-w-xs">
                    <Wind className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-blue-800 mb-2">Hora de Respirar</h2>
                    <p className="text-sm text-blue-600 mb-6 leading-relaxed">Acompanhe o ritmo para se acalmar.</p>
                    <button onClick={startBreathing} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Play className="fill-current w-5 h-5" /> Iniciar
                    </button>
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-blue-600 mb-8">{phase}</h2>
                    <div className="relative flex items-center justify-center">
                        <div className="breathing-circle bg-blue-300/50 rounded-full absolute"></div>
                        <div className="breathing-core bg-blue-500 rounded-full w-24 h-24 z-10 shadow-lg flex items-center justify-center text-white"><Wind className="w-10 h-10" /></div>
                    </div>
                    <CycleText setPhase={setPhase} />
                </>
            )}
            <style>{`.breathing-circle { width: 100px; height: 100px; animation: breathe ${BREATH_CYCLE.TOTAL}s infinite ease-in-out; } @keyframes breathe { 0% { transform: scale(1); } ${(BREATH_CYCLE.IN / BREATH_CYCLE.TOTAL) * 100}% { transform: scale(2.5); } ${((BREATH_CYCLE.IN + BREATH_CYCLE.HOLD) / BREATH_CYCLE.TOTAL) * 100}% { transform: scale(2.5); } ${((BREATH_CYCLE.IN + BREATH_CYCLE.HOLD + BREATH_CYCLE.OUT) / BREATH_CYCLE.TOTAL) * 100}% { transform: scale(1); } 100% { transform: scale(1); } }`}</style>
        </div>
    );
};

const ColorLights = () => {
    const colors = ['#BFDBFE', '#BBF7D0', '#FEF9C3', '#FBCFE8', '#DDD6FE', '#FEE2E2'];
    const [colorIdx, setColorIdx] = useState(0);
    return (
        <button onClick={() => { soundGen.init(); setColorIdx(i => (i + 1) % colors.length); }}
            className="w-full h-full rounded-3xl transition-colors duration-1000 shadow-inner flex items-center justify-center"
            style={{ backgroundColor: colors[colorIdx] }}>
            <div className="text-center p-6 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                <Palette className="w-12 h-12 mx-auto mb-2 text-white drop-shadow-md" />
                <p className="text-white font-black drop-shadow-md uppercase tracking-widest">Toque para mudar</p>
            </div>
        </button>
    );
};

const AnimalSounds: React.FC<{ volume: number }> = ({ volume }) => {
    const [activeAnimal, setActiveAnimal] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
    }, []);

    const playSound = (animal: typeof ANIMALS_DATA[0]) => {
        soundGen.stop(); 
        
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setIsLoading(animal.name);
        
        // CORREÇÃO: Uso direto do Audio constructor.
        // Google CDN fornece MP3s padrão que não requerem configurações complexas de fetch/blob.
        const audio = new Audio(animal.audioUrl);
        audio.volume = volume;
        audioRef.current = audio;

        // Toca apenas quando possível
        audio.oncanplaythrough = () => {
            setIsLoading(null);
            setActiveAnimal(animal.name);
            audio.play().catch(err => {
                console.error("Erro de reprodução:", err);
                // Fallback silencioso em caso de restrição de autoplay
                setIsLoading(null);
            });
        };

        audio.onended = () => setActiveAnimal(null);
        
        audio.onerror = (e) => {
            console.error("Erro ao carregar áudio:", animal.name, e);
            setIsLoading(null);
            setActiveAnimal(null);
        };

        // Inicia carregamento
        audio.load();
    };

    return (
        <div className="flex flex-col items-center h-full gap-4 max-h-[85vh]">
            <h3 className="text-xl font-black text-slate-700 mb-2 shrink-0">Quem faz esse som?</h3>
            <div className="flex-1 overflow-y-auto w-full px-2 py-1 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full pb-4">
                    {ANIMALS_DATA.map(animal => (
                        <button key={animal.name} onClick={() => playSound(animal)} disabled={!!isLoading}
                            className={`${animal.color} p-6 rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform shadow-sm active:scale-95 relative overflow-hidden ${activeAnimal === animal.name ? 'ring-4 ring-blue-400' : ''}`}
                        >
                            <span className="text-4xl relative z-10">
                                {isLoading === animal.name ? <Loader2 className="animate-spin" /> : animal.icon}
                            </span>
                            <span className="text-xs font-bold text-slate-700 relative z-10">{animal.name}</span>
                            {activeAnimal === animal.name && <div className="absolute inset-0 bg-white/30 animate-pulse z-0" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ZenDrawing = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 15; ctx.strokeStyle = '#3B82F6';
    }, []);
    const getPos = (e: any) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left, y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top };
    };
    const startDraw = (e: any) => {
        soundGen.init(); setIsDrawing(true);
        const { x, y } = getPos(e); const ctx = canvasRef.current!.getContext('2d')!;
        ctx.beginPath(); ctx.moveTo(x, y);
    };
    const draw = (e: any) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e); const ctx = canvasRef.current!.getContext('2d')!;
        ctx.lineTo(x, y); ctx.stroke();
    };
    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2"><PenTool className="w-5 h-5 text-emerald-500" /> Rabiscar para Relaxar</h3>
                <button onClick={() => { const c = canvasRef.current!; c.getContext('2d')!.clearRect(0,0,c.width,c.height); }} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">Limpar</button>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl border-4 border-dashed border-slate-200 relative overflow-hidden">
                <canvas ref={canvasRef} width={400} height={500} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} className="w-full h-full touch-none cursor-crosshair" />
            </div>
        </div>
    );
};

const GuidedMeditation: React.FC<{ volume: number, childAge: number }> = ({ volume, childAge }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Stop audio when component unmounts or changes
    useEffect(() => {
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
                audioSourceRef.current = null;
            }
        };
    }, []);

    const handleStart = async (themeId: string) => {
        // Se já estiver tocando o mesmo tema, para.
        if (isPlaying && selectedTheme === themeId) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
            setSelectedTheme(null);
            return;
        }

        // Se estiver tocando outro, para o anterior primeiro.
        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
        }

        const ctx = soundGen.init(); 
        if (!ctx) return;
        
        setSelectedTheme(themeId);
        setIsLoading(true);
        
        try {
            const theme = MEDITATION_THEMES.find(t => t.id === themeId);
            if (!theme) return;

            const cmd = theme.prompt(childAge);
            
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: cmd }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: childAge < 8 ? 'Puck' : 'Zephyr' } } } }
            });
            const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64) {
                const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                const source = ctx.createBufferSource(); 
                source.buffer = buffer; 
                source.connect(soundGen.masterGainNode!);
                source.onended = () => {
                    setIsPlaying(false);
                    setSelectedTheme(null);
                }; 
                source.start(); 
                audioSourceRef.current = source; 
                setIsPlaying(true);
            }
        } catch (e) { 
            console.error(e); 
            setSelectedTheme(null);
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 p-2 animate-in fade-in">
            <div className="text-center mb-2">
                <h3 className="text-xl font-black text-slate-700 flex items-center justify-center gap-2">
                    <BrainCircuit className="w-6 h-6 text-cyan-500" /> Meditação Guiada
                </h3>
                <p className="text-xs text-slate-500">Escolha uma jornada para relaxar</p>
            </div>

            <div className="grid gap-3 flex-1 overflow-y-auto content-start">
                {MEDITATION_THEMES.map(theme => {
                    const isActive = selectedTheme === theme.id;
                    return (
                        <button 
                            key={theme.id} 
                            onClick={() => handleStart(theme.id)}
                            disabled={isLoading && !isActive && selectedTheme !== null}
                            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left relative overflow-hidden group ${isActive ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg scale-[1.02]' : `${theme.color} hover:bg-white`}`}
                        >
                            <div className={`p-2 rounded-full bg-white/90 shadow-sm transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {theme.icon}
                            </div>
                            <div className="flex-1 z-10">
                                <h4 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>{theme.title}</h4>
                                <p className={`text-xs ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>{theme.description}</p>
                            </div>
                            <div className="z-10">
                                {isLoading && isActive ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                ) : isActive ? (
                                    <Square className="w-6 h-6 fill-current text-white" />
                                ) : (
                                    <Play className={`w-6 h-6 fill-current ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-400'}`} />
                                )}
                            </div>
                            {/* Background Pulse Effect when Active */}
                            {isActive && (
                                <div className="absolute inset-0 bg-white/10 animate-pulse z-0" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const SoundMachine = () => {
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const toggleSound = (type: string) => {
        soundGen.init();
        if (activeSound === type) { soundGen.stop(); setActiveSound(null); } 
        else { soundGen.stop(); if (type === 'rain') soundGen.playRain(); if (type === 'zen') soundGen.playDrone(); if (type === 'wind') soundGen.playWind(); if (type === 'heartbeat') soundGen.playHeartbeat(); if (type === 'waves') soundGen.playWaves(); if (type === 'calm_piano') soundGen.playCalmPiano(); setActiveSound(type); }
    };
    return (
        <div className="flex flex-col items-center justify-center gap-4 h-full">
            <h3 className="text-xl font-bold text-slate-700">Sons da Natureza</h3>
            <div className="grid grid-cols-2 gap-4 w-full"> 
                {['rain', 'zen', 'wind', 'heartbeat', 'waves', 'calm_piano'].map(s => (
                    <button key={s} onClick={() => toggleSound(s)} className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all ${activeSound === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'}`}>
                        <Volume2 className="w-6 h-6 mb-1" /> <span className="text-sm font-bold capitalize">{s.replace('_', ' ')}</span>
                    </button>
                ))}
            </div>
            <button onClick={() => { soundGen.init(); soundGen.playTibetanBell(); }} className="mt-4 p-4 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200 font-bold w-full flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" /> Tocar Sino Tibetano</button>
        </div>
    );
};

const FidgetBubble = () => {
    const bubbleGradients = [
        'from-blue-300 to-blue-500 border-blue-200',
        'from-emerald-300 to-emerald-500 border-emerald-200',
        'from-purple-300 to-purple-500 border-purple-200',
        'from-pink-300 to-pink-500 border-pink-200',
        'from-amber-300 to-amber-500 border-amber-200',
        'from-rose-300 to-rose-500 border-rose-200'
    ];
    
    const [bubbles, setBubbles] = useState(Array(12).fill(false)); 
    const [colorIdx, setColorIdx] = useState(0);

    const pop = (i: number) => { 
        soundGen.init();
        if (!bubbles[i]) { 
            const n = [...bubbles]; n[i] = true; setBubbles(n); soundGen.playPop(); 
            if (n.every(b => b)) {
                setTimeout(() => {
                    setBubbles(Array(12).fill(false));
                    setColorIdx(prev => (prev + 1) % bubbleGradients.length);
                }, 800); 
            }
        } 
    };

    return (
        <div className="flex flex-col items-center h-full">
            <h3 className="text-xl font-bold text-slate-700 mb-6">Estoure as Bolhas</h3>
            <div className="grid grid-cols-3 gap-4">
                {bubbles.map((p, i) => (
                    <button 
                        key={i} 
                        onClick={() => pop(i)} 
                        className={`w-20 h-20 rounded-full shadow-md transition-all border-4 ${p ? 'bg-slate-200 border-slate-300 scale-90 shadow-inner' : `bg-gradient-to-br ${bubbleGradients[colorIdx]} hover:scale-105 active:scale-95`}`} 
                    />
                ))}
            </div>
        </div>
    );
};

const SocialStories: React.FC<{ volume: number, childAge: number }> = ({ volume, childAge }) => {
    const [index, setIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const handlePlay = async () => {
        if (isPlaying) { audioSourceRef.current?.stop(); setIsPlaying(false); return; }
        const ctx = soundGen.init(); if (!ctx) return;
        setIsLoading(true);
        try {
            const systemInstruction = childAge < 5 ? "Diga com voz suave e protetora:" : "Diga com voz de narrador amigável:";
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: `${systemInstruction} ${STORIES_DATA[index].text}` }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } }
            });
            const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64) {
                const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(soundGen.masterGainNode!);
                source.onended = () => setIsPlaying(false); source.start(); audioSourceRef.current = source; setIsPlaying(true);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 w-full max-w-md mx-auto">
            <div className="w-full flex-1 flex flex-col bg-[#FFFBEB] border-[6px] border-[#FCD34D] rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
                <h3 className="text-xl font-black text-slate-800 text-center mb-6 mt-2">{STORIES_DATA[index].title}</h3> 
                <div className="bg-white p-6 rounded-[2rem] flex-grow flex items-center justify-center text-center text-lg font-bold text-slate-700 leading-relaxed">"{STORIES_DATA[index].text}"</div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-6 w-full px-2 max-w-sm">
                <button onClick={() => setIndex(i => (i > 0 ? i - 1 : STORIES_DATA.length - 1))} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full font-bold text-xs">Anterior</button>
                <button onClick={handlePlay} disabled={isLoading} className={`h-14 px-8 rounded-full font-black text-white flex items-center justify-center gap-2 transition-all ${isPlaying ? 'bg-red-500' : 'bg-green-500 shadow-lg'}`}>{isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Square className="fill-current w-5 h-5"/> : <Play className="fill-current w-6 h-6"/>}</button>
                <button onClick={() => setIndex(i => (i < STORIES_DATA.length - 1 ? i + 1 : 0))} className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-bold text-xs">Próximo</button>
            </div>
        </div>
    );
};

// --- NOVO: PAINEL DE ESCOLHAS (AAC - Comunicação Alternativa) ---
const ChoiceBoard = () => {
    const [category, setCategory] = useState<keyof typeof CHOICE_BOARD_DATA.items | null>(null);
    const [sentence, setSentence] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const speak = async (text: string) => {
        if (isPlaying) return;
        const ctx = soundGen.init(); 
        if (!ctx) return;
        setIsLoading(true);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: `Diga com voz de criança animada: ${text}` }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } }
            });
            const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64) {
                const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                const source = ctx.createBufferSource(); 
                source.buffer = buffer; 
                source.connect(soundGen.masterGainNode!);
                source.onended = () => setIsPlaying(false);
                setIsPlaying(true);
                source.start(); 
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const handleSpeakSentence = () => {
        if (sentence.length === 0) return;
        const fullText = "Eu quero " + sentence.map(s => s.label).join(" ");
        speak(fullText);
    };

    const removeWord = (index: number) => {
        setSentence(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col h-full p-2">
            {/* Sentence Strip Container */}
            <div className="bg-slate-50 rounded-3xl p-4 mb-4 shadow-inner border border-slate-100">
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-3 flex flex-col md:flex-row items-center justify-between shadow-sm min-h-[6rem] gap-4">
                    <div className="flex items-center gap-3 flex-1 w-full overflow-hidden">
                        <div className="flex flex-col gap-1 shrink-0">
                            <span className="font-black text-blue-600 text-[10px] uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 w-fit">EU QUERO</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1">
                            {sentence.length === 0 ? (
                                <span className="text-slate-300 text-sm italic">Selecione os quadros abaixo...</span>
                            ) : (
                                sentence.map((item, i) => (
                                    <span key={i} className="text-slate-800 font-extrabold text-base md:text-lg animate-in fade-in slide-in-from-left-2 transition-all">
                                        {item.label}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                        <button 
                            onClick={() => setSentence([])} 
                            disabled={sentence.length === 0}
                            className={`p-2.5 rounded-2xl transition-all ${sentence.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} 
                            title="Limpar tudo"
                        >
                            <Trash2 className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={handleSpeakSentence} 
                            disabled={sentence.length === 0 || isLoading || isPlaying}
                            className={`p-4 rounded-[1.5rem] shadow-lg transition-all transform active:scale-95 flex items-center justify-center ${isLoading || isPlaying ? 'bg-slate-300' : 'bg-green-500 hover:bg-green-600 text-white ring-2 ring-green-100'}`}
                        >
                            {isLoading ? <Loader2 className="animate-spin w-6 h-6"/> : isPlaying ? <Volume2 className="w-6 h-6 animate-pulse"/> : <Play className="w-6 h-6 fill-current translate-x-0.5"/>}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[10px] text-blue-400 mt-4 font-black uppercase tracking-widest opacity-80">
                    Toque no quadro abaixo para remover da sua frase
                </p>

                {/* Visual Preview Grid for selected items */}
                {sentence.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-white/60 rounded-[2rem] p-4 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4">
                        {sentence.map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => removeWord(i)}
                                className="flex flex-col items-center justify-center bg-white rounded-2xl p-2 shadow-sm border-2 border-blue-50 relative group animate-in zoom-in h-20 w-full hover:border-red-300 hover:bg-red-50 transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="text-4xl group-hover:scale-90 transition-transform">{item.icon}</span>
                                <span className="text-[9px] font-black text-slate-700 truncate w-full text-center mt-1 border-t border-slate-50 pt-1 uppercase">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Categories or Items */}
            {!category ? (
                <div className="grid grid-cols-2 gap-3 overflow-y-auto content-start flex-1 pb-20 px-1">
                    {CHOICE_BOARD_DATA.categories.map(cat => (
                        <button key={cat.id} onClick={() => setCategory(cat.id as any)} className={`${cat.color} border-b-[6px] p-4 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 h-40 shadow-sm border-2 border-transparent hover:border-white/50`}>
                            <span className="text-6xl drop-shadow-sm mb-1">{cat.icon}</span>
                            <span className="font-black text-slate-700 text-lg">{cat.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <button onClick={() => setCategory(null)} className="flex items-center gap-2 text-slate-500 font-black text-xs bg-slate-100 px-4 py-2.5 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"><ArrowLeft className="w-4 h-4"/> CATEGORIAS</button>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{category}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 overflow-y-auto content-start flex-1 pb-20 px-1">
                        {CHOICE_BOARD_DATA.items[category]
                            .filter((item: any) => !sentence.some(s => s.label === item.label))
                            .map((item: any, i: number) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSentence([...sentence, item])}
                                    className="bg-white border-2 border-slate-100 border-b-[4px] p-2 rounded-3xl flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 active:scale-95 h-32 shadow-sm transition-all group"
                                >
                                    <span className="text-5xl mb-1 group-hover:scale-110 transition-transform">{item.icon}</span>
                                    <span className="font-black text-[10px] text-slate-700 text-center leading-tight uppercase">{item.label}</span>
                                </button>
                            ))}
                        {/* Empty state if all items selected */}
                        {CHOICE_BOARD_DATA.items[category].every((item: any) => sentence.some(s => s.label === item.label)) && (
                            <div className="col-span-3 py-12 text-center text-slate-400 italic text-sm">
                                Todos os itens destas categoria já estão na sua frase.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- NOVO: GERADOR DE HISTÓRIAS SOCIAIS (Customizadas) ---
const SocialStoriesGenerator = () => {
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [storyText, setStoryText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const generateAndPlay = async (scenarioId: string) => {
        const scenario = SOCIAL_SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        setSelectedScenario(scenarioId);
        setIsLoading(true);
        setStoryText(null);
        
        if (audioSourceRef.current) audioSourceRef.current.stop();

        const ctx = soundGen.init(); 
        if (!ctx) return;

        try {
            // 1. Gerar Texto
            const textResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ parts: [{ text: scenario.prompt }] }]
            });
            const generatedText = textResponse.text || "História indisponível.";
            setStoryText(generatedText);

            // 2. Gerar Áudio
            const audioResponse = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: `Conte com voz calma e amigável: ${generatedText}` }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } }
            });
            
            const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64) {
                const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                const source = ctx.createBufferSource(); 
                source.buffer = buffer; 
                source.connect(soundGen.masterGainNode!);
                source.onended = () => setIsPlaying(false);
                setIsPlaying(true);
                source.start(); 
                audioSourceRef.current = source;
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const stop = () => {
        if (audioSourceRef.current) audioSourceRef.current.stop();
        setIsPlaying(false);
        setSelectedScenario(null);
    };

    if (selectedScenario && (isLoading || storyText)) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-yellow-200 max-w-sm w-full relative">
                    <button onClick={stop} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><VolumeX/></button>
                    <div className="text-4xl mb-4">{SOCIAL_SCENARIOS.find(s => s.id === selectedScenario)?.icon}</div>
                    <h3 className="font-bold text-xl text-slate-800 mb-4">{SOCIAL_SCENARIOS.find(s => s.id === selectedScenario)?.title}</h3>
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2 py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500"/>
                            <p className="text-sm text-slate-500">Criando sua história...</p>
                        </div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto text-left text-sm text-slate-600 leading-relaxed font-medium bg-yellow-50 p-4 rounded-xl">
                            {storyText}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="text-center">
                <h3 className="text-lg font-bold text-slate-700">Histórias Sociais</h3>
                <p className="text-xs text-slate-500">Escolha um tema para ouvir uma história.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto content-start pb-4">
                {SOCIAL_SCENARIOS.map(s => (
                    <button key={s.id} onClick={() => generateAndPlay(s.id)} className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-yellow-100 hover:scale-[1.02] transition-all">
                        <span className="text-3xl">{s.icon}</span>
                        <span className="font-bold text-sm text-yellow-800 text-center">{s.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- NOVO: LEITURA INTERATIVA (Alfabetização) ---
const InteractiveReading = () => {
    const [word, setWord] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [result, setResult] = useState<{text: string, emoji: string} | null>(null);
    const recognitionRef = useRef<any>(null);

    const handleRead = async (textToRead?: string) => {
        const targetWord = textToRead || word;
        if (!targetWord.trim()) return;
        
        const ctx = soundGen.init(); 
        if (!ctx) return;
        setIsLoading(true);
        setResult(null);

        try {
            // 1. Gerar Explicação Simples
            const textResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ parts: [{ text: `Explique a palavra "${targetWord}" para uma criança pequena de forma mágica, divertida e curta (máx 2 frases). Retorne um JSON: { "text": "explicação", "emoji": "emoji_relacionado" }` }] }],
                config: { responseMimeType: 'application/json' }
            });
            const data = JSON.parse(textResponse.text || '{}');
            setResult(data);

            // 2. Ler
            const audioResponse = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: `A palavra mágica é ${targetWord}! ${data.text}` }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } } }
            });
            const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64) {
                const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                const source = ctx.createBufferSource(); 
                source.buffer = buffer; 
                source.connect(soundGen.masterGainNode!);
                source.start(); 
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            const cleanWord = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
            setWord(cleanWord);
            handleRead(cleanWord);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="w-full max-w-sm">
                <h3 className="text-xl font-black text-indigo-600 mb-6 text-center flex items-center justify-center gap-2"><Sparkles className="w-5 h-5"/> Leitura Mágica</h3>
                
                <div className="relative mb-6">
                    <input 
                        type="text" 
                        value={word} 
                        onChange={e => setWord(e.target.value)} 
                        placeholder={isListening ? "Ouvindo..." : "Digite uma palavra..."} 
                        className={`w-full p-4 pr-14 rounded-2xl border-4 ${isListening ? 'border-red-400 animate-pulse' : 'border-indigo-200'} text-center text-xl font-bold text-slate-700 focus:border-indigo-400 outline-none placeholder:text-slate-300 transition-all`}
                    />
                    <button 
                        onClick={toggleListening}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}
                        title={isListening ? "Parar de ouvir" : "Falar palavra"}
                    >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                </div>

                <button 
                    onClick={() => handleRead()} 
                    disabled={isLoading || !word || isListening}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin"/> : "Ler Palavra Mágica ✨"}
                </button>

                {result && (
                    <div className="mt-8 bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 text-center animate-in zoom-in">
                        <div className="text-6xl mb-4">{result.emoji}</div>
                        <p className="text-lg font-medium text-indigo-900 leading-relaxed">"{result.text}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- NOVO: LABORATÓRIO ASMR (Autonomous Sensory Meridian Response) ---
const AsmrLab = () => {
    const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
    const groups = [
        {
            title: "Baixa Intensidade (Suaves)",
            color: "text-indigo-600",
            triggers: [
                { id: 'whisper', label: 'Sussurro', icon: '👂', color: 'bg-indigo-50 border-indigo-200', text: 'Classic Whispering' },
                { id: 'pages', label: 'Páginas', icon: '📖', color: 'bg-blue-50 border-blue-200', text: 'Livros e papel' },
                { id: 'brushes', label: 'Pincéis', icon: '🖌️', color: 'bg-indigo-50 border-indigo-100', text: 'Cerdas suaves' }
            ]
        },
        {
            title: "Percussão",
            color: "text-emerald-600",
            triggers: [
                { id: 'tapping', label: 'Tapping', icon: '💅', color: 'bg-emerald-50 border-emerald-200', text: 'Batidas rítmicas' },
                { id: 'scratching', label: 'Scratching', icon: '🧴', color: 'bg-emerald-100 border-emerald-300', text: 'Raspar superfícies' }
            ]
        },
        {
            title: "Atenção Pessoal",
            color: "text-rose-600",
            triggers: [
                { id: 'medical', label: 'Médico/Corte', icon: '🩺', color: 'bg-rose-50 border-rose-200', text: 'Cuidado simulado' },
                { id: 'spa', label: 'Spa/Massagem', icon: '💆', color: 'bg-rose-100 border-rose-300', text: 'Água e cremes' }
            ]
        },
        {
            title: "Natureza e Ambiente",
            color: "text-amber-600",
            triggers: [
                { id: 'rain', label: 'Chuva', icon: '🌧️', color: 'bg-blue-100 border-blue-200', text: 'Ruído Branco' },
                { id: 'fireplace', label: 'Lareira', icon: '🔥', color: 'bg-orange-100 border-orange-200', text: 'Crepitar relaxante' },
                { id: 'writing', label: 'Escrita', icon: '✍️', color: 'bg-amber-50 border-amber-200', text: 'Lápis e papel' }
            ]
        }
    ];

    const toggleAsmr = (id: string) => {
        if (activeTrigger === id) {
            soundGen.stop();
            setActiveTrigger(null);
        } else {
            soundGen.playAsmr(id as any);
            setActiveTrigger(id);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in">
            <div className="text-center mb-2 px-4 shrink-0">
                <h3 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500 fill-current" /> Laboratório ASMR
                </h3>
                <p className="text-xs text-slate-500">Toque sensorial para relaxamento e foco</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-20 px-2 scroll-smooth">
                {groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-3">
                        <h4 className={`text-[10px] font-black uppercase tracking-widest pl-2 ${group.color}`}>{group.title}</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {group.triggers.map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => toggleAsmr(t.id)}
                                    className={`w-full p-4 rounded-[2rem] border-2 flex items-center gap-4 transition-all shadow-sm ${activeTrigger === t.id ? 'bg-slate-900 border-slate-900 text-white scale-[0.98]' : `${t.color} hover:bg-white active:scale-95`}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${activeTrigger === t.id ? 'bg-white/10' : 'bg-white'}`}>
                                        {t.icon}
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-black text-sm uppercase tracking-tight">{t.label}</h4>
                                        <p className={`text-[10px] font-bold ${activeTrigger === t.id ? 'text-slate-400' : 'text-slate-500'}`}>{t.text}</p>
                                    </div>
                                    {activeTrigger === t.id && (
                                        <div className="flex gap-1 mr-2 items-center">
                                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 bg-white/50 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.2}s` }} />)}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/80 backdrop-blur-md rounded-[2.5rem] flex items-center gap-4 border border-white/50 shadow-xl z-10">
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Mecanismo Neural</p>
                    <p className="text-[9px] text-slate-500 font-medium italic">O formigamento parassimpático ajuda a baixar o cortisol e induzir o estado de sono profundo.</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wind className="w-5 h-5 text-blue-500 animate-bounce-slow" />
                </div>
            </div>
        </div>
    );
};

const VolumeSlider = ({ volume, setVolume }: { volume: number; setVolume: (v: number) => void }) => {
    const VolumeIcon = volume === 0 ? VolumeX : (volume < 0.5 ? Volume1 : Volume2);
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-slate-100 rounded-lg shadow-inner w-full max-w-sm">
            <VolumeIcon className={`w-6 h-6 ${volume === 0 ? 'text-red-500' : 'text-slate-600'}`} />
            <input type="range" min="0" max="1.0" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer" />
        </div>
    );
};

const SensoryView: React.FC<{ onBack: () => void, childProfile: ChildExtendedProfile | null }> = ({ onBack, childProfile }) => {
    const [activeTool, setActiveTool] = useState<'menu' | 'breath' | 'sound' | 'fidget' | 'stories' | 'piano' | 'genius' | 'colors' | 'animals' | 'drawing' | 'meditation' | 'communication' | 'literacy' | 'social_stories' | 'storycubes' | 'asmr'>('menu');
    const [masterVolume, setMasterVolume] = useState(INITIAL_MASTER_VOLUME);
    const childAge = useMemo(() => {
        if (!childProfile?.birthDate) return 10;
        const birth = new Date(childProfile.birthDate); const now = new Date(); let age = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--; return age;
    }, [childProfile]);
    useEffect(() => { soundGen.setMasterVolume(masterVolume); }, [masterVolume]);
    
    const availableTools = useMemo(() => {
        // Default config includes new tools as 'true' for fallback, though user profile controls them
        const config = childProfile?.sensoryConfig || { 
            allowBreath: true, allowSound: true, allowFidget: true, allowStories: true, allowPiano: true, 
            allowGenius: true, allowColors: true, allowAnimals: true, allowDrawing: true, allowMeditation: true,
            allowCommunication: true, allowSocialStories: true, allowLiteracy: true, allowAsmr: true
        };
        const tools = [];
        // Original Tools
        if (config.allowAsmr !== false) tools.push({ id: 'asmr', label: 'ASMR', icon: <Music className="w-10 h-10 text-indigo-500" />, color: 'bg-indigo-50 text-indigo-900' });
        if (config.allowColors) tools.push({ id: 'colors', label: 'Luzes', icon: <Palette className="w-10 h-10 text-pink-500" />, color: 'bg-pink-100 text-pink-800' });
        if (config.allowAnimals) tools.push({ id: 'animals', label: 'Animais', icon: <Dog className="w-10 h-10 text-amber-600" />, color: 'bg-amber-100 text-amber-800' });
        if (config.allowSound) tools.push({ id: 'sound', label: 'Sons', icon: <Music className="w-10 h-10 text-purple-600" />, color: 'bg-purple-100 text-purple-800' });
        if (config.allowFidget) tools.push({ id: 'fidget', label: 'Bolhas', icon: <Grid className="w-10 h-10 text-red-500"/>, color: 'bg-red-100 text-red-800' });
        if (config.allowBreath) tools.push({ id: 'breath', label: 'Respirar', icon: <Wind className="w-10 h-10 text-blue-600" />, color: 'bg-blue-100 text-blue-800' });
        if (config.allowDrawing) tools.push({ id: 'drawing', label: 'Desenho', icon: <PenTool className="w-10 h-10 text-emerald-600" />, color: 'bg-emerald-100 text-emerald-800' });
        if (config.allowPiano) tools.push({ id: 'piano', label: 'Piano', icon: <Music className="w-10 h-10 text-orange-600" />, color: 'bg-orange-100 text-orange-800' });
        if (config.allowGenius) tools.push({ id: 'genius', label: 'Genius', icon: <Gamepad2 className="w-10 h-10 text-indigo-600" />, color: 'bg-indigo-100 text-indigo-800' });
        if (config.allowStories) tools.push({ id: 'stories', label: 'Histórias', icon: <BookOpen className="w-10 h-10 text-yellow-600" />, color: 'bg-yellow-100 text-yellow-800' });
        if (config.allowMeditation) tools.push({ id: 'meditation', label: 'Meditar', icon: <BrainCircuit className="w-10 h-10 text-cyan-600" />, color: 'bg-cyan-100 text-cyan-800' });
        
        // 🆕 NEW TOOLS (Communication & Literacy) - Configurable via profile
        if (config.allowCommunication) tools.push({ id: 'communication', label: 'Comunicação', icon: <MessageCircle className="w-10 h-10 text-teal-600" />, color: 'bg-teal-100 text-teal-800' });
        if (config.allowSocialStories) tools.push({ id: 'social_stories', label: 'Histórias Sociais', icon: <BookOpenCheck className="w-10 h-10 text-lime-600" />, color: 'bg-lime-100 text-lime-800' });
        if (config.allowLiteracy) tools.push({ id: 'literacy', label: 'Leitura Mágica', icon: <Sparkles className="w-10 h-10 text-violet-600" />, color: 'bg-violet-100 text-violet-800' });
        if (config.allowStoryCubes !== false) tools.push({ id: 'storycubes', label: 'Dados', icon: <RefreshCw className="w-10 h-10 text-purple-500" />, color: 'bg-purple-50 text-purple-900' });

        return tools;
    }, [childProfile]);

    const renderTool = () => {
        switch (activeTool) {
            case 'breath': return <BreathingExercise />;
            case 'sound': return <SoundMachine />;
            case 'fidget': return <FidgetBubble />;
            case 'stories': return <SocialStories volume={masterVolume} childAge={childAge} />;
            case 'piano': return <CalmPiano soundGen={soundGen} />; 
            case 'genius': return <SimonGame soundGen={soundGen} />; 
            case 'colors': return <ColorLights />;
            case 'animals': return <AnimalSounds volume={masterVolume} />;
            case 'drawing': return <ZenDrawing />;
            case 'meditation': return <GuidedMeditation volume={masterVolume} childAge={childAge} />;
            // 🆕 New Components
            case 'communication': return <ChoiceBoard />;
            case 'social_stories': return <SocialStoriesGenerator />;
            case 'literacy': return <InteractiveReading />;
            case 'storycubes': return <StoryCubes soundGen={soundGen} />;
            case 'asmr': return <AsmrLab />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col h-screen overflow-hidden">
            <div className="bg-white p-4 shadow-sm flex items-center justify-between shrink-0">
                {activeTool === 'menu' ? (<h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="text-yellow-500 fill-current" /> Sala da Calma</h1>) : (<button onClick={() => { soundGen.stop(); setActiveTool('menu'); }} className="flex items-center gap-2 text-slate-600 font-bold"><ArrowLeft /> Voltar</button>)}
                <button onClick={() => { soundGen.stop(); onBack(); }} className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm">Estou melhor! 💚</button>
            </div>
            <div className="flex justify-center shrink-0 bg-white shadow-sm pb-3 px-4 z-50"><VolumeSlider volume={masterVolume} setVolume={setMasterVolume} /></div>
            <div className="flex-1 p-4 overflow-y-auto pb-24">
                {activeTool === 'menu' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 content-start pb-12">
                        {availableTools.map(t => (
                            <button key={t.id} onClick={() => { soundGen.init(); setActiveTool(t.id as any); }} className={`${t.color} p-6 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-sm aspect-square hover:scale-105 transition-transform`}>
                                {t.icon} <span className="font-bold text-sm text-center leading-tight">{t.label}</span>
                            </button>
                        ))}
                    </div>
                ) : (<div className="h-full flex flex-col bg-white rounded-3xl shadow-sm p-4 border border-slate-100 relative">{renderTool()}</div>)}
            </div>
        </div>
    );
};

export default SensoryView;
