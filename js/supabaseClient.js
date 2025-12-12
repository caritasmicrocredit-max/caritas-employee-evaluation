// تكوين Supabase
const supabaseUrl = 'https://pzsxhypigslcvduegvpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3hoeXBpZ3NsY3ZkdWVndnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTMxOTQsImV4cCI6MjA4MTA2OTE5NH0.0LC452nPLSywGh1mKxNQedm3M_yWZ4srck-gK67iZag';

// إنشاء عميل Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// دالة تسجيل الدخول
async function login(username, password) {
    try {
        // البحث عن المستخدم في جدول employees
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('username', username)
            .single();

        if (error) {
            console.error('خطأ في البحث عن المستخدم:', error);
            return { 
                success: false, 
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
            };
        }

        if (!data) {
            return { 
                success: false, 
                message: 'اسم المستخدم غير موجود' 
            };
        }

        // تحقق من كلمة المرور (هذا غير آمن - للتجريب فقط)
        // في الإنتاج، يجب استخدام مقارنة مشفرة
        if (data.password === password || data.password_hash === password) {
            // حفظ بيانات المستخدم في localStorage
            localStorage.setItem('currentUser', JSON.stringify(data));
            return { 
                success: true, 
                user: data 
            };
        } else {
            return { 
                success: false, 
                message: 'كلمة المرور غير صحيحة' 
            };
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { 
            success: false, 
            message: 'حدث خطأ أثناء تسجيل الدخول' 
        };
    }
}

// دالة الحصول على المستخدم الحالي
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// دالة تسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// دالة اختبار الاتصال
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('count')
            .limit(1);

        if (error) {
            console.error('خطأ في الاتصال:', error);
            return false;
        }

        console.log('الاتصال ناجح');
        return true;
    } catch (error) {
        console.error('خطأ في اختبار الاتصال:', error);
        return false;
    }
}

// تصدير الدوال للاستخدام
window.supabaseClient = {
    supabase,
    login,
    getCurrentUser,
    logout,
    testConnection
};