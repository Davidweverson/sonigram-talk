import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const CHANGELOG = [
  { version: '2.0.0', date: '2026-04-09', changes: [
    'Auth com email/senha e recuperação de senha',
    'Ações de mensagem: editar, excluir, responder, copiar',
    'Links clicáveis e timestamps inteligentes',
    'Sistema de amigos com código único',
    'Mensagens diretas (DMs)',
    'Envio de imagens, vídeos e GIFs',
    'Painel de administração',
    'Canais de anúncio (somente leitura)',
    'Tema claro/escuro',
    'Sistema de denúncias',
  ]},
  { version: '1.0.0', date: '2026-04-07', changes: [
    'Lançamento do Sonigram',
    'Chat em tempo real com Supabase',
    '20 salas públicas',
    'Indicadores de digitação',
  ]},
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('sonigram_sound') !== 'false');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('sonigram_notif') !== 'false');
  const [activeTab, setActiveTab] = useState<'prefs' | 'changelog'>('prefs');

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('sonigram_sound', String(next));
  };

  const toggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem('sonigram_notif', String(next));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/chat')} className="p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('prefs')}
            className={`px-4 py-2 text-sm rounded-xl transition-colors ${activeTab === 'prefs' ? 'bg-primary text-primary-foreground' : 'glass text-foreground hover:bg-muted/50'}`}>
            Preferências
          </button>
          <button onClick={() => setActiveTab('changelog')}
            className={`px-4 py-2 text-sm rounded-xl transition-colors ${activeTab === 'changelog' ? 'bg-primary text-primary-foreground' : 'glass text-foreground hover:bg-muted/50'}`}>
            Novidades
          </button>
        </div>

        {activeTab === 'prefs' ? (
          <div className="glass rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Tema</p>
                  <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Escuro' : 'Claro'}</p>
                </div>
              </div>
              <button onClick={toggleTheme}
                className="px-3 py-1.5 text-xs rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                Alternar
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Som de notificação</p>
                  <p className="text-xs text-muted-foreground">{soundEnabled ? 'Ativado' : 'Desativado'}</p>
                </div>
              </div>
              <button onClick={toggleSound}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${soundEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {soundEnabled ? 'Desativar' : 'Ativar'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <div className="flex items-center gap-3">
                {notifEnabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Notificações do navegador</p>
                  <p className="text-xs text-muted-foreground">{notifEnabled ? 'Ativadas' : 'Desativadas'}</p>
                </div>
              </div>
              <button onClick={toggleNotif}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${notifEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {notifEnabled ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-4 space-y-6">
            {CHANGELOG.map((entry) => (
              <div key={entry.version}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-primary">v{entry.version}</span>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="space-y-1">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span> {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
