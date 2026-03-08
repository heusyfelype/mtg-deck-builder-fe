import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
            console.log("api base: ", apiBase)
            const res = await fetch(`${apiBase}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tokenId: credentialResponse.credential }),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('mtg_token', data.data.token);
                localStorage.setItem('mtg_user', JSON.stringify(data.data.user));
                navigate('/home');
            } else {
                console.error('Login falhou:', data.message);
                alert('Falha no login com Google: ' + data.message);
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            alert('Erro de comunicação com o servidor. Tente novamente mais tarde.');
        }
    };

    return (
        <div className="view-login">
            <div className="view-login__card">
                <div className="view-login__header">
                    <h1 className="view-login__title">Bem-vindo de volta</h1>
                    <p className="view-login__subtitle">Entre na sua conta para gerenciar seus decks.</p>
                </div>

                <div className="view-login__google view-login__google--exclusive">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                            console.log('Login Failed');
                            alert('Google Login Falhou. Tente novamente.');
                        }}
                        theme="filled_black"
                        size="large"
                        width="100%"
                        text="signin_with"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
