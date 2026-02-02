import React, { useState, useEffect, useRef } from 'react';
import { Lock, User as UserIcon, ArrowRight, Mail, ArrowLeft, Check } from 'lucide-react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
  users: any[];
}

const LoginScreen: React.FC<Props> = ({ onLogin, users }) => {
  const [view, setView] = useState<'login' | 'recovery'>('login');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  // Canvas Ref for Background Animation
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Background Animation Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Particle Configuration
    const particleCount = Math.floor((width * height) / 15000); // Responsive density
    const particles: { x: number; y: number; vx: number; vy: number; color: string }[] = [];
    
    // Requested Colors: Blue, Green, Orange
    const colors = ['#3B82F6', '#10B981', '#F97316']; 

    // Helper to convert Hex to RGB for opacity handling
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    // Initialize Particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5, // Slow movement
            vy: (Math.random() - 0.5) * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    let animationFrameId: number;

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // 1. Dark background base
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // 2. Smooth Gradients
        
        // Green Glow - Top Left area
        const greenGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.5);
        greenGlow.addColorStop(0, 'rgba(16, 185, 129, 0.15)'); // Green
        greenGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = greenGlow;
        ctx.fillRect(0, 0, width, height);

        // Orange Glow - Top Right area
        const orangeGlow = ctx.createRadialGradient(width, 0, 0, width, 0, Math.max(width, height) * 0.5);
        orangeGlow.addColorStop(0, 'rgba(249, 115, 22, 0.15)'); // Orange
        orangeGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = orangeGlow;
        ctx.fillRect(0, 0, width, height);

        // Blue Glow - Bottom Center area
        const blueGlow = ctx.createRadialGradient(width * 0.5, height, 0, width * 0.5, height, height * 0.8);
        blueGlow.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); // Blue
        blueGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = blueGlow;
        ctx.fillRect(0, 0, width, height);

        particles.forEach((p, i) => {
            // Update Position
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Draw Node (Dot)
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for lines

            // Draw Connections (Lines)
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Connect if close enough
                if (distance < 150) {
                    ctx.beginPath();
                    // Fade out line based on distance
                    const opacity = 1 - (distance / 150);
                    
                    // Use the color of the source particle for the line
                    const rgb = hexToRgb(p.color);
                    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.4})`;
                    
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });

        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Find user by username OR email (case insensitive for flexibility)
      // Use stable user.id if available for tracking, but here we validate credentials
      const userRecord = users.find((u: any) => 
        (u.username.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase()) && 
        u.password === password
      );

      if (userRecord) {
        onLogin({
          id: userRecord.id,
          username: userRecord.username,
          name: userRecord.name,
          role: userRecord.role,
          avatar: userRecord.avatar,
          email: userRecord.email
        });
      } else {
        setError('Usuário ou senha inválidos');
        setLoading(false);
      }
    }, 800);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoveryStatus('sending');

    // 1. Try Backend API
    try {
        const response = await fetch('http://localhost:3001/api/recover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: recoveryEmail }),
            signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
            setTimeout(() => {
                setRecoveryStatus('success');
                setRecoveryMessage(`Enviamos um email para ${recoveryEmail} com as instruções de recuperação.`);
            }, 500);
            return;
        }
    } catch (err) {
        console.warn("Backend API unavailable for recovery, falling back to local simulation.");
    }

    // 2. Fallback Simulation (if backend is down)
    setTimeout(() => {
        const user = users.find((u: any) => u.email === recoveryEmail || u.username === recoveryEmail);
        
        if (user && user.email) {
            setRecoveryStatus('success');
            setRecoveryMessage(`(Offline) Simulação: Email enviado para ${user.email}`);
        } else {
            setRecoveryStatus('success');
            setRecoveryMessage(`Se existir uma conta para "${recoveryEmail}", enviamos um link de redefinição.`);
        }
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Dynamic Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#18181b]/80 backdrop-blur-xl border border-[#333] rounded-2xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500 min-h-[450px] flex flex-col justify-center">
        
        {/* Logo / Header Area */}
        {view === 'login' ? (
          <>
            <div className="text-center mb-8">
               <img src="onesystem.png" alt="AJM OneSystem" className="h-16 mx-auto mb-6 object-contain" />
               <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
               <p className="text-gray-400 text-sm">Insira suas credenciais para acessar o AJM OneSystem</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 ml-1">USUÁRIO</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#09090b]/80 border border-[#333] text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
                    placeholder="admin ou user"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400 ml-1">SENHA</label>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#09090b]/80 border border-[#333] text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
                    placeholder="••••"
                  />
                </div>
                <div className="flex justify-end pt-1">
                     <button 
                        type="button" 
                        onClick={() => { setView('recovery'); setError(''); setRecoveryStatus('idle'); setRecoveryEmail(''); }}
                        className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                    >
                        Esqueceu a senha?
                    </button>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs text-center bg-red-900/20 py-2 rounded border border-red-900/30 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Entrar <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#27272a] rounded-full mx-auto flex items-center justify-center mb-4 border border-[#333] shadow-inner">
                        <Mail size={32} className="text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Redefinir Senha</h1>
                    <p className="text-gray-400 text-sm">Insira seu endereço de email e enviaremos um link para redefinir sua senha.</p>
                </div>

                {recoveryStatus === 'success' ? (
                     <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-6 text-center animate-in zoom-in-95">
                         <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Check size={24} className="text-green-400"/>
                         </div>
                         <h3 className="text-green-400 font-semibold mb-2">Verifique seu email</h3>
                         <p className="text-xs text-gray-300 leading-relaxed mb-4">{recoveryMessage}</p>
                         <button 
                            onClick={() => setView('login')}
                            className="text-xs text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition-colors w-full"
                         >
                             Voltar para Login
                         </button>
                     </div>
                ) : (
                    <form onSubmit={handleRecoverySubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 ml-1">ENDEREÇO DE EMAIL</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="text"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    className="w-full bg-[#09090b]/80 border border-[#333] text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Digite seu email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={recoveryStatus === 'sending' || !recoveryEmail}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-900/40"
                        >
                            {recoveryStatus === 'sending' ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                            <>
                                Enviar Link
                            </>
                            )}
                        </button>

                         <button 
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16}/> Voltar para Login
                        </button>
                    </form>
                )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;