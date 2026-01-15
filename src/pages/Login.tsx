import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Validação em tempo real do email
  useEffect(() => {
    if (email.length === 0) {
      setEmailError('');
      return;
    }

    if (!email.includes('@')) {
      setEmailError('Email deve conter @');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email inválido');
      return;
    }

    setEmailError('');
  }, [email]);

  // Validação em tempo real da senha
  useEffect(() => {
    if (password.length === 0) {
      setPasswordError('');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setPasswordError('');
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Validações finais antes de enviar
    if (emailError || passwordError) {
      return;
    }

    if (!email || !password) {
      setLoginError('Preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLoginError('Email ou senha inválidos');
          return;
        }
        
        if (response.status >= 500) {
          setLoginError('Erro no servidor. Tente novamente mais tarde.');
          return;
        }

        // Tentar extrair mensagem de erro do backend
        try {
          const errorData = await response.json();
          setLoginError(errorData.message || 'Erro ao fazer login');
        } catch {
          setLoginError('Erro ao fazer login. Verifique suas credenciais.');
        }
        return;
      }

      const data = await response.json();

      // Salvar token e dados do usuário
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (error) {
      // Erro de rede ou conexão
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setLoginError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        setLoginError('Erro inesperado. Tente novamente.');
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailValid = email.length > 0 && !emailError;
  const isPasswordValid = password.length > 0 && !passwordError;
  const canSubmit = isEmailValid && isPasswordValid && !isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Hacktown</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailError ? 'border-red-500' : isEmailValid ? 'border-green-500' : ''}
                  disabled={isLoading}
                />
                {isEmailValid && (
                  <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                )}
              </div>
              {emailError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${passwordError ? 'border-red-500' : isPasswordValid ? 'border-green-500' : ''} pr-20`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                {isPasswordValid && (
                  <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                )}
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!canSubmit}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
