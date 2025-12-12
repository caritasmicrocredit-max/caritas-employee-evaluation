import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('خطأ في تسجيل الدخول: ' + error.message);
      return;
    }

    // بعد تسجيل الدخول، احضر الدور role_id
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id, role_id, branch, project_id')
      .eq('email', email)
      .single();

    if (empErr) {
      alert('حدث خطأ أثناء جلب بيانات المستخدم: ' + empErr.message);
      return;
    }

    // تحويل حسب role_id
    switch (emp.role_id) {
      case 1:
        window.location.href = '/specialist-dashboard';
        break;
      case 2:
        window.location.href = '/teamleader-dashboard';
        break;
      case 3:
        window.location.href = '/manager-dashboard';
        break;
      case 4:
        window.location.href = '/project-dashboard';
        break;
      case 5:
        window.location.href = '/admin-dashboard';
        break;
      default:
        alert("لم يتم التعرف على دور المستخدم.");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>تسجيل الدخول</h2>

      <input
        type="email"
        placeholder="البريد الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />

      <input
        type="password"
        placeholder="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />

      <button
        onClick={handleLogin}
        style={{ width: '100%', padding: '10px' }}
      >
        تسجيل الدخول
      </button>
    </div>
  );
}
