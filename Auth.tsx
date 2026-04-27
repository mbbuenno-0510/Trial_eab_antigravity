
import React, { useState, useEffect } from 'react';
import firebase, { auth, db } from './services/firebase';
import { ProfileType, MoodType } from './types';
import { Loader2, ArrowLeft, User, ShieldCheck, CheckCircle2, Stethoscope, GraduationCap, Mail, RefreshCw, Send, LogIn, FileText, Smartphone } from 'lucide-react';
import RobotMascot from './components/RobotMascot';
import LandingPage from './components/LandingPage';
import { usePWAInstall } from './hooks/usePWAInstall';

interface AuthProps {
  onLoginSuccess: () => void;
  onShowPWAHint?: () => void;
}

type AuthView = 'LOGIN' | 'PROFILE_SELECT' | 'REGISTER' | 'VERIFY_EMAIL' | 'RECOVERY';

// Paleta de Cores Pastel
const pastel = {
  blue: "#A9CCE3", // Principal (Criança/Login)
  yellow: "#F9E79F", // Secundário (Adulto)
  pink: "#F1948A", // Destaque/Atenção (Links/Erros)
  green: "#A3E4D7", // Responsável/Highlight
  teal: "#76D7C4",   // Profissional
  purple: "#D7BDE2" // Escola
};

const HEALTH_COUNCILS = ['CRM', 'CRP', 'CREFITO', 'CRF', 'COREN', 'Outros'];

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onShowPWAHint }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [showLanding, setShowLanding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Professional State
  const [professionalCouncil, setProfessionalCouncil] = useState('CRM');
  const [professionalCode, setProfessionalCode] = useState('');

  // School State
  const [cnpj, setCnpj] = useState('');

  // Guardian State
  const [guardianName, setGuardianName] = useState('');
  const [guardianPin, setGuardianPin] = useState('');

  // Child Specific
  const [childUsername, setChildUsername] = useState('');
  const [childPassword, setChildPassword] = useState('');

  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const { isInstallable, isStandalone, installPWA } = usePWAInstall();
  
  // Estado para armazenar credenciais temporárias durante a verificação
  const [pendingCreds, setPendingCreds] = useState<{email: string, password: string} | null>(null);

  // Verificar estado inicial se já existe usuário mas não verificado
  useEffect(() => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
          // Se for criança (dominio mock), ignora a verificação
          if (!auth.currentUser.email?.endsWith('@child.eab.app')) {
              setEmail(auth.currentUser.email || '');
              setView('VERIFY_EMAIL');
          }
      }
  }, []);

  // Polling automático para verificar e-mail
  useEffect(() => {
    let interval: any;
    if (view === 'VERIFY_EMAIL') {
        const checkStatus = async () => {
            if (auth.currentUser) {
                try {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                        clearInterval(interval);
                        await auth.signOut();
                        setSuccessMessage("E-mail verificado com sucesso! Faça login para começar.");
                        setView('LOGIN');
                        setPendingCreds(null);
                    }
                } catch (e: any) {
                    if (e.code === 'auth/network-request-failed') return;
                    console.error("Erro ao verificar status:", e);
                }
            } else if (pendingCreds) {
                 // Tenta relogar silenciosamente para checar status se sessão caiu
                 try {
                    const cred = await auth.signInWithEmailAndPassword(pendingCreds.email, pendingCreds.password);
                    if (cred.user?.emailVerified) {
                        clearInterval(interval);
                        await auth.signOut();
                        setSuccessMessage("E-mail verificado com sucesso! Faça login para começar.");
                        setView('LOGIN');
                        setPendingCreds(null);
                    }
                 } catch (e) {
                     // Ignora erros de login silencioso
                 }
            }
        };

        // Verifica a cada 3 segundos
        interval = setInterval(checkStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [view, pendingCreds]);

  const handleProfileSelect = (type: ProfileType) => {
    setSelectedProfile(type);
    setView('REGISTER');
    setError(null);
    setSuccessMessage(null);

    setName('');
    setPassword('');
    setEmail('');
    setProfessionalCouncil('CRM');
    setProfessionalCode('');
    setCnpj('');
    setGuardianName('');
    setGuardianPin('');
    setChildUsername('');
    setChildPassword('');
  };

  const executeRegistration = async () => {
      setLoading(true);
      setError(null);
      
      // Re-sanitize inputs
      const cleanEmail = email.trim();
      const cleanPassword = password;
      const cleanGuardianPin = guardianPin.trim();
      const cleanChildUsername = childUsername.trim().toLowerCase().replace(/\s+/g, '');

      try {
        if (selectedProfile === ProfileType.CHILD) {
            // 1. Cria o Responsável (Este receberá o e-mail de verificação)
            const guardianCredential = await auth.createUserWithEmailAndPassword(cleanEmail, cleanGuardianPin);
            const guardianUser = guardianCredential.user;
            
            if (guardianUser) {
                await guardianUser.updateProfile({ displayName: guardianName.trim() });
                // ENVIA O E-MAIL DE VERIFICAÇÃO NATIVO DO FIREBASE
                await guardianUser.sendEmailVerification();
            }

            const guardianData = {
              uid: guardianUser?.uid,
              email: guardianUser?.email,
              displayName: guardianName.trim(),
              profileType: ProfileType.ADULT,
              manages: [],
              createdAt: Date.now(),
            };
            if (guardianUser) await db.collection("users").doc(guardianUser.uid).set(guardianData);
            
            // 2. Cria a Criança (Sem verificação de email pois é fake)
            const childFullEmail = `${cleanChildUsername}@child.eab.app`;
            // Pequeno delay para garantir ordem no backend se necessário
            await new Promise(r => setTimeout(r, 500));
            
            const childCredential = await auth.createUserWithEmailAndPassword(childFullEmail, childPassword);
            const childUser = childCredential.user;
            if (childUser) await childUser.updateProfile({ displayName: name.trim() });

            const childData = {
              uid: childUser?.uid,
              email: childFullEmail,
              displayName: name.trim(),
              childUsername: cleanChildUsername,
              profileType: ProfileType.CHILD,
              linkedGuardianId: guardianUser?.uid,
              childPassword: childPassword,
              createdAt: Date.now(),
            };
            if (childUser) await db.collection("users").doc(childUser.uid).set(childData);
            
            // 3. Vincula e prepara verificação
            // Logar como pai para verificação
            await auth.signInWithEmailAndPassword(cleanEmail, cleanGuardianPin);
            if (guardianUser) {
                await db.collection("users").doc(guardianUser.uid).update({
                    manages: firebase.firestore.FieldValue.arrayUnion(childUser?.uid),
                });
            }
            
            setPendingCreds({ email: cleanEmail, password: cleanGuardianPin });
            setView('VERIFY_EMAIL');

        } else {
            // Adulto, Profissional ou Escola
            const userCredential = await auth.createUserWithEmailAndPassword(cleanEmail, cleanPassword);
            const user = userCredential.user;
            
            if (user) {
                await user.updateProfile({ displayName: name.trim() });
                // ENVIA O E-MAIL DE VERIFICAÇÃO NATIVO DO FIREBASE
                await user.sendEmailVerification();
            }

            let profileTypeToSave = null; 
            if (selectedProfile === ProfileType.PROFESSIONAL) profileTypeToSave = ProfileType.PROFESSIONAL;
            if (selectedProfile === ProfileType.SCHOOL) profileTypeToSave = ProfileType.SCHOOL;

            const userData: any = {
              uid: user?.uid,
              email: user?.email,
              displayName: name.trim(),
              profileType: profileTypeToSave, 
              createdAt: Date.now(),
            };

            if (selectedProfile === ProfileType.PROFESSIONAL) {
                userData.professionalCouncil = professionalCouncil;
                userData.professionalCode = professionalCode;
                userData.professionalId = `${professionalCouncil} ${professionalCode}`;
            }

            if (selectedProfile === ProfileType.SCHOOL) {
                userData.cnpj = cnpj.replace(/[^\d]+/g, ''); 
            }

            if (user) await db.collection("users").doc(user.uid).set(userData);
            
            // Mantém logado para a tela de verificação
            setPendingCreds({ email: cleanEmail, password: cleanPassword });
            setView('VERIFY_EMAIL');
        }
      } catch (err: any) {
          console.error(err);
          let msg = "Erro ao criar conta.";
          if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
          if (err.code === 'auth/weak-password') msg = "A senha é muito fraca.";
          setError(msg);
      } finally {
          setLoading(false);
      }
  };

  const resendVerification = async () => {
      if (auth.currentUser) {
          try {
              await auth.currentUser.sendEmailVerification();
              setSuccessMessage("Novo e-mail de verificação enviado!");
          } catch (e) {
              setError("Aguarde alguns minutos antes de reenviar.");
          }
      }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, digite seu e-mail para recuperar a senha.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await auth.sendPasswordResetEmail(email.trim());
      setSuccessMessage("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setView('LOGIN');
    } catch (err: any) {
      console.error(err);
      let msg = "Erro ao enviar e-mail de recuperação.";
      if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      if (err.code === 'auth/invalid-email') msg = "E-mail inválido.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim(); 
    const cleanPassword = password; 
    const cleanGuardianPin = guardianPin.trim();
    const cleanChildUsername = childUsername.trim().toLowerCase().replace(/\s+/g, ''); 

    const performAuth = async (retryCount = 0): Promise<any> => {
      try {
        if (view === 'REGISTER') {
          if (!selectedProfile) throw new Error("Erro: Perfil não selecionado.");

          if (selectedProfile === ProfileType.CHILD) {
            if (!cleanEmail || !guardianName.trim() || !cleanGuardianPin)
              throw new Error("Preencha os dados do Responsável.");
            if (!name.trim() || !cleanChildUsername || !childPassword)
              throw new Error("Preencha os dados da Criança.");
            if (cleanGuardianPin.length < 6)
              throw new Error("A senha do responsável deve ter no mínimo 6 caracteres.");
            if (childPassword.length < 6)
              throw new Error("A senha da criança deve ter no mínimo 6 caracteres.");
            if (/[^a-z0-9._-]/.test(cleanChildUsername)) {
               throw new Error("O usuário da criança deve conter apenas letras minúsculas, números, ponto ou traço.");
            }
          } else {
            if (!name.trim() || !cleanEmail || !cleanPassword)
              throw new Error("Preencha todos os campos.");
            if (selectedProfile === ProfileType.PROFESSIONAL && !professionalCode) {
               throw new Error("Por favor, preencha o número de registro profissional.");
            }
            if (selectedProfile === ProfileType.SCHOOL && !cnpj) {
               throw new Error("Por favor, preencha o CNPJ da escola.");
            }
          }

          // INICIA O PROCESSO DE REGISTRO E VERIFICAÇÃO
          await executeRegistration();
          return;
        } 
        
        // --- LOGIN FLOW ---
        let loginIdentifier = cleanEmail;
        let isChildLogin = false;
        if (!loginIdentifier.includes('@')) {
          loginIdentifier = `${loginIdentifier.toLowerCase().replace(/\s+/g, '')}@child.eab.app`;
          isChildLogin = true;
        } else if (loginIdentifier.endsWith('@child.eab.app')) {
          isChildLogin = true;
        }

        const cred = await auth.signInWithEmailAndPassword(loginIdentifier, cleanPassword);
        
        // --- CHECK EMAIL VERIFICATION ---
        // Se não for criança (que tem email fake), EXIGE verificação
        if (cred.user && !cred.user.emailVerified && !isChildLogin) {
            setPendingCreds({ email: loginIdentifier, password: cleanPassword });
            setView('VERIFY_EMAIL');
        } else {
            onLoginSuccess();
        }
      } catch (err: any) {
        if (err.code === 'auth/network-request-failed' && retryCount < 2) {
          console.warn(`Tentativa de autenticação falhou (rede). Tentando novamente... (${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return performAuth(retryCount + 1);
        }
        throw err;
      }
    };

    try {
      await performAuth();
    } catch (err: any) {
      console.error(err);
      let msg = "Erro ao processar.";
      if (err.message) msg = err.message;
      if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      if (err.code === 'auth/invalid-email') msg = "O formato do e-mail é inválido.";
      if (err.code === 'auth/email-already-in-use') {
        if (view === 'REGISTER' && selectedProfile === ProfileType.CHILD && !guardianName)
          msg = "Este e-mail de responsável já está cadastrado.";
        else if (view === 'REGISTER' && selectedProfile === ProfileType.CHILD)
          msg = "Este nome de usuário para a criança já existe. Tente outro.";
        else msg = "Este e-mail já está cadastrado. Tente fazer login.";
      }
      if (err.code === 'auth/network-request-failed') {
        msg = "Erro de conexão. Verifique sua internet ou se há algum bloqueador (AdBlock) impedindo o acesso ao Firebase.";
      }
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-login-credentials') {
        msg = "Dados de acesso incorretos. Verifique e-mail/usuário e senha.";
      }
      setError(msg);
    } finally {
      if (view !== 'VERIFY_EMAIL') setLoading(false);
    }
  };

  const getThemeColor = () => {
      if (view === 'REGISTER' || view === 'VERIFY_EMAIL') {
          if (selectedProfile === ProfileType.CHILD) return pastel.blue;
          if (selectedProfile === ProfileType.PROFESSIONAL) return pastel.teal;
          if (selectedProfile === ProfileType.SCHOOL) return pastel.purple;
          return pastel.yellow;
      }
      return pastel.yellow;
  };

  // Se o estado showLanding for verdadeiro, renderiza a apresentação
  if (showLanding) {
      return <LandingPage onBack={() => setShowLanding(false)} onRegister={() => { setShowLanding(false); setView('PROFILE_SELECT'); }} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 font-sans"
      style={{
        background: `linear-gradient(135deg, ${pastel.blue} 0%, ${pastel.yellow} 25%, ${pastel.green} 60%, ${pastel.purple} 100%)`,
      }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl p-6 shadow-3xl transition-all duration-300 hover:shadow-4xl bg-white/95 backdrop-blur-sm relative overflow-hidden border-[6px] border-slate-100"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          borderColor: getThemeColor(),
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center gap-2 md:gap-6 mb-2">
            <div className="transform scale-90 md:scale-100">
              <RobotMascot 
                mood={MoodType.HAPPY} 
                isInstallable={false}
              />
            </div>
            
            {!isStandalone && isInstallable && (
              <button 
                onClick={() => {
                  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                    if (onShowPWAHint) onShowPWAHint();
                  } else {
                    installPWA();
                  }
                }}
                className="group flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/50"
              >
                <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-bold text-indigo-100 uppercase tracking-widest leading-none">Aplicativo</span>
                  <span className="block text-sm font-black text-white leading-tight">INSTALAR</span>
                </div>
                <div className="w-8 h-1 bg-white/30 rounded-full group-hover:w-full transition-all"></div>
              </button>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-1 text-slate-900 drop-shadow-sm" style={{ color: pastel.blue }}>EAB</h1>
          <p className="text-slate-600 font-bold text-center text-sm px-4">
            {view === 'PROFILE_SELECT' ? 'Quem vai usar o aplicativo?' : view === 'VERIFY_EMAIL' ? 'Confirmação de E-mail' : 'Bem-vindo(a), vamos começar o dia!'}
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 text-center text-sm p-3 rounded-xl border-2 animate-in fade-in slide-in-from-top-1 shadow-lg flex items-center justify-center gap-2" style={{ color: '#155724', backgroundColor: '#D4EDDA', borderColor: '#C3E6CB' }}>
            <CheckCircle2 size={16} /> <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 text-center text-sm bg-red-100 p-3 rounded-xl border-2 animate-in fade-in slide-in-from-top-1 shadow-lg" style={{ color: '#C0392B', borderColor: pastel.pink }}>
            {error}
          </div>
        )}

        {/* PROFILE SELECT */}
        {view === 'PROFILE_SELECT' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 w-full">
            <fieldset className="rounded-3xl p-6 pt-4 relative border-4 shadow-xl bg-white/50 backdrop-blur-sm" style={{ border: `3px solid ${pastel.blue}` }}>
              <legend className="text-lg font-black px-4 text-slate-800 uppercase tracking-widest bg-white rounded-full border-2 border-blue-200 shadow-sm" style={{ color: pastel.blue }}>Tipo de Perfil</legend>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button type="button" onClick={() => handleProfileSelect(ProfileType.CHILD)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-[4px] border-r-[4px] border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 active:border-0 active:translate-y-1 active:translate-x-1 active:shadow-inner transition-all duration-200 h-32 group">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-md transform group-hover:scale-110 transition-transform duration-300 border-2 border-white ring-2 ring-blue-50"><span className="text-2xl filter drop-shadow-sm">🧸</span></div>
                  <span className="font-black text-xs text-slate-700 uppercase tracking-wide group-hover:text-blue-600 transition-colors">Criança</span>
                </button>
                <button type="button" onClick={() => handleProfileSelect(ProfileType.ADULT)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-[4px] border-r-[4px] border-yellow-200 shadow-lg hover:shadow-xl hover:border-yellow-300 active:border-0 active:translate-y-1 active:translate-x-1 active:shadow-inner transition-all duration-200 h-32 group">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-md transform group-hover:scale-110 transition-transform duration-300 border-2 border-white ring-2 ring-yellow-50"><span className="text-2xl filter drop-shadow-sm">👤</span></div>
                  <span className="font-black text-xs text-slate-700 uppercase tracking-wide group-hover:text-yellow-600 transition-colors">Adulto</span>
                </button>
                <button type="button" onClick={() => handleProfileSelect(ProfileType.PROFESSIONAL)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-[4px] border-r-[4px] border-teal-200 shadow-lg hover:shadow-xl hover:border-teal-300 active:border-0 active:translate-y-1 active:translate-x-1 active:shadow-inner transition-all duration-200 h-32 group">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-green-400 shadow-md transform group-hover:scale-110 transition-transform duration-300 border-2 border-white ring-2 ring-teal-50"><Stethoscope className="w-6 h-6 text-white drop-shadow-sm" /></div>
                  <span className="font-black text-xs text-slate-700 uppercase tracking-wide group-hover:text-teal-600 transition-colors text-center leading-tight">Profissional</span>
                </button>
                <button type="button" onClick={() => handleProfileSelect(ProfileType.SCHOOL)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-b-[4px] border-r-[4px] border-purple-200 shadow-lg hover:shadow-xl hover:border-purple-300 active:border-0 active:translate-y-1 active:translate-x-1 active:shadow-inner transition-all duration-200 h-32 group">
                  <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-300 to-indigo-400 shadow-md transform group-hover:scale-110 transition-transform duration-300 border-2 border-white ring-2 ring-purple-50"><GraduationCap className="w-6 h-6 text-white drop-shadow-sm" /></div>
                  <span className="font-black text-xs text-slate-700 uppercase tracking-wide group-hover:text-purple-600 transition-colors text-center leading-tight">Escola</span>
                </button>
              </div>
            </fieldset>
            <button onClick={() => setView('LOGIN')} className="w-full mt-4 flex items-center justify-center gap-2 font-bold py-3 text-slate-900 hover:text-slate-900 transition-colors" style={{ color: pastel.pink }}><ArrowLeft className="w-5 h-5" /> Voltar ao Login</button>
          </div>
        )}

        {/* VERIFY EMAIL LINK VIEW */}
        {view === 'VERIFY_EMAIL' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 w-full text-center">
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
                    <Mail className="w-16 h-16 mx-auto text-blue-500 mb-4 animate-bounce" />
                    <h3 className="font-bold text-slate-800 text-xl mb-2">Verifique seu E-mail</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Enviamos um <strong>link de confirmação</strong> para:
                        <br/>
                        <span className="font-bold text-blue-700 block mt-1 text-base">{email}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-4 italic">
                        Clique no link enviado para ativar sua conta.<br/>
                        Aguarde, a verificação será detectada automaticamente...
                    </p>
                    <div className="mt-4 flex justify-center">
                        <Loader2 className="animate-spin text-blue-600 w-6 h-6" />
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={resendVerification}
                        className="w-full text-blue-600 font-bold py-3 rounded-xl border-2 border-blue-100 hover:bg-blue-50 flex items-center justify-center transition-all"
                    >
                        <Send className="w-4 h-4 mr-2" /> Reenviar E-mail
                    </button>
                </div>

                <button
                    onClick={() => { setView('LOGIN'); auth.signOut(); }}
                    className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                    <LogIn className="w-3 h-3"/> Voltar para Login
                </button>
            </div>
        )}

        {/* PASSWORD RECOVERY VIEW */}
        {view === 'RECOVERY' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 w-full">
            <div className="bg-yellow-50 p-6 rounded-2xl border-2 border-yellow-200 text-center">
              <RefreshCw className="w-16 h-16 mx-auto text-yellow-500 mb-4 animate-spin-slow" />
              <h3 className="font-bold text-slate-800 text-xl mb-2">Recuperar Senha</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Digite seu e-mail abaixo e enviaremos um link para você criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-800">E-mail</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="email@exemplo.com" 
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" 
                  style={{ borderColor: pastel.yellow }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full text-white font-extrabold py-3.5 rounded-xl shadow-2xl hover:shadow-3xl mt-4 flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02]" 
                style={{ backgroundColor: pastel.yellow, boxShadow: `0 10px 15px -3px ${pastel.yellow}80` }}
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "ENVIAR E-MAIL DE RECUPERAÇÃO"}
              </button>

              <button
                type="button"
                onClick={() => { setView('LOGIN'); setError(null); setSuccessMessage(null); }}
                className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={16} /> Voltar para Login
              </button>
            </form>
          </div>
        )}

        {/* REGISTER OR LOGIN FORM */}
        {(view === 'LOGIN' || view === 'REGISTER') && (
          <form onSubmit={handleAuth} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {view === 'REGISTER' ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 mb-2 shadow-xl" style={{ backgroundColor: getThemeColor() + "60", borderColor: getThemeColor() }}>
                  <span className="text-2xl">{selectedProfile === ProfileType.CHILD ? '🧸' : selectedProfile === ProfileType.PROFESSIONAL ? <Stethoscope className="w-6 h-6"/> : selectedProfile === ProfileType.SCHOOL ? <GraduationCap className="w-6 h-6"/> : '👤'}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-slate-700">Criando conta para</p>
                    <p className="font-extrabold text-lg" style={{ color: selectedProfile === ProfileType.CHILD ? pastel.blue : selectedProfile === ProfileType.PROFESSIONAL ? '#0f766e' : selectedProfile === ProfileType.SCHOOL ? '#7e22ce' : '#ca8a04' }}>
                      {selectedProfile === ProfileType.CHILD ? 'Criança' : selectedProfile === ProfileType.PROFESSIONAL ? 'Profissional' : selectedProfile === ProfileType.SCHOOL ? 'Escola' : 'Adulto'}
                    </p>
                  </div>
                  <button type="button" onClick={() => setView('PROFILE_SELECT')} className="text-sm font-extrabold underline hover:no-underline transition-colors text-slate-900" style={{ color: pastel.pink }}>Alterar</button>
                </div>

                {selectedProfile === ProfileType.CHILD ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-800">E-mail do Responsável (Login)</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@email.com" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" style={{ borderColor: pastel.blue, backgroundColor: "#FFFFFF" }} />
                    </div>
                    <div className="rounded-xl p-4 shadow-xl border-2" style={{ backgroundColor: pastel.green + "40", borderColor: pastel.green }}>
                      <div className="flex items-center gap-2 mb-3 text-slate-900" style={{ color: pastel.green }}><ShieldCheck className="w-5 h-5" /><span className="text-sm font-extrabold uppercase tracking-wide">Dados do Responsável</span></div>
                      <div className="space-y-3">
                        <div><label className="block text-xs font-bold mb-1 text-slate-800">Nome do Responsável</label><input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Ex: Maria Silva" className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 text-sm shadow-md" style={{ borderColor: pastel.green }} /></div>
                        <div><label className="block text-xs font-bold mb-1 text-slate-800">Senha do Responsável</label><input type="password" value={guardianPin} onChange={(e) => setGuardianPin(e.target.value)} placeholder="••••••" className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 text-sm font-mono shadow-md" style={{ borderColor: pastel.green }} /></div>
                      </div>
                    </div>
                    <div className="rounded-xl p-4 shadow-2xl border-2" style={{ backgroundColor: pastel.blue + "40", borderColor: pastel.blue }}>
                      <div className="flex items-center gap-2 mb-3 text-slate-900" style={{ color: pastel.blue }}><User className="w-5 h-5" /><span className="text-sm font-extrabold uppercase tracking-wide">Dados da Criança</span></div>
                      <div className="space-y-3">
                        <div><label className="block text-xs font-bold mb-1 text-slate-800">Nome Completo</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pedro Souza" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-md" style={{ borderColor: pastel.blue }} /></div>
                        <div><label className="block text-xs font-bold mb-1 text-slate-900" style={{ color: pastel.blue }}>Nome de Usuário (Login)</label><input type="text" value={childUsername} onChange={(e) => setChildUsername(e.target.value)} placeholder="pedrinho123" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 placeholder-slate-500 bg-white shadow-md" style={{ borderColor: pastel.blue }} /><p className="text-[10px] mt-1 text-slate-700 font-medium">Sem espaços. A criança usará este nome para entrar.</p></div>
                        <div><label className="block text-xs font-bold mb-1 text-slate-800">Senha/PIN da Criança</label><input type="password" value={childPassword} onChange={(e) => setChildPassword(e.target.value)} placeholder="••••••" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 placeholder-slate-500 font-mono text-lg shadow-md" style={{ borderColor: pastel.blue }} /></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div><label className="block text-sm font-bold mb-1 text-slate-800">{selectedProfile === ProfileType.PROFESSIONAL ? 'Nome Completo (Profissional)' : selectedProfile === ProfileType.SCHOOL ? 'Nome da Escola' : 'Nome de Usuário'}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={selectedProfile === ProfileType.SCHOOL ? "Ex: Escola Caminho do Saber" : "Ex: Dr. João Silva"} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" style={{ borderColor: getThemeColor() }} /></div>
                    {selectedProfile === ProfileType.PROFESSIONAL && (
                        <div className="flex gap-2">
                            <div className="w-1/3"><label className="block text-sm font-bold mb-1 text-slate-800">Conselho</label><div className="relative"><select value={professionalCouncil} onChange={(e) => setProfessionalCouncil(e.target.value)} className="w-full px-2 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 bg-white appearance-none shadow-lg" style={{ borderColor: getThemeColor() }}>{HEALTH_COUNCILS.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                            <div className="w-2/3"><label className="block text-sm font-bold mb-1 text-slate-800">Nº Registro</label><input type="text" value={professionalCode} onChange={(e) => setProfessionalCode(e.target.value)} placeholder="Ex: 123456" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" style={{ borderColor: getThemeColor() }} /></div>
                        </div>
                    )}
                    {selectedProfile === ProfileType.SCHOOL && (<div><label className="block text-sm font-bold mb-1 text-slate-800">CNPJ</label><input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" style={{ borderColor: getThemeColor() }} /></div>)}
                    <div><label className="block text-sm font-bold mb-1 text-slate-800">E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" style={{ borderColor: getThemeColor() }} /></div>
                    <div><label className="block text-sm font-bold mb-1 text-slate-800">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 font-mono text-lg shadow-lg" style={{ borderColor: getThemeColor() }} /></div>
                  </>
                )}
              </>
            ) : (
              <>
                <div><label className="block text-sm font-bold mb-1 text-slate-800">E-mail ou Usuário</label><input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com ou usuario" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-300 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 shadow-lg" style={{ borderColor: pastel.blue }} /></div>
                <div><label className="block text-sm font-bold mb-1 text-slate-800">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-300 focus:ring-opacity-70 text-slate-900 placeholder-slate-500 font-mono text-lg shadow-lg" style={{ borderColor: pastel.blue }} /></div>
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setView('RECOVERY'); setError(null); setSuccessMessage(null); }}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    ESQUECEU A SENHA?
                  </button>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full text-white font-extrabold py-3.5 rounded-xl shadow-2xl hover:shadow-3xl mt-4 flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02]" style={{ backgroundColor: view === 'LOGIN' ? pastel.blue : getThemeColor(), boxShadow: `0 10px 15px -3px ${view === 'LOGIN' ? pastel.blue : getThemeColor()}80, 0 4px 6px -2px ${view === 'LOGIN' ? pastel.blue : getThemeColor()}40` }}>{loading ? (<Loader2 className="animate-spin w-6 h-6" />) : view === 'REGISTER' ? ('CADASTRAR E VERIFICAR') : ('ENTRAR')}</button>

            <div className="mt-4 text-center">
              {view === 'LOGIN' ? (<button type="button" onClick={() => setView('PROFILE_SELECT')} className="text-sm font-extrabold hover:underline transition-colors text-slate-900" style={{ color: pastel.pink }}>NÃO TEM CONTA? CRIE AGORA</button>) : (<button type="button" onClick={() => setView('LOGIN')} className="text-sm font-extrabold hover:underline transition-colors text-slate-900" style={{ color: pastel.pink }}>JÁ TEM UMA CONTA? FAÇA LOGIN</button>)}
              <div className="mt-6 border-t border-slate-200/50 pt-4 text-center space-y-2">
                  <button 
                      type="button"
                      onClick={() => setShowLanding(true)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white/50 hover:bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"
                  >
                      <FileText className="w-3 h-3" /> Ver Apresentação do Projeto
                  </button>
                  <p className="text-slate-800 font-medium text-center text-xs opacity-70">
                      Desenvolvido por MichelBB
                  </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
