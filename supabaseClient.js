// supabaseClient.js
// ملف الاتصال بقاعدة بيانات Supabase

const SUPABASE_URL = 'https://pzsxhypigslcvduegvpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c3hoeXBpZ3NsY3ZkdWVndnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTMxOTQsImV4cCI6MjA4MTA2OTE5NH0.0LC452nPLSywGh1mKxNQedm3M_yWZ4srck-gK67iZag';

// إنشاء اتصال Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// دوال المصادقة (Authentication)
// ============================================================

// تسجيل الدخول
async function login(username, password) {
    try {
        // البحث عن المستخدم
        const { data: user, error } = await supabase
            .from('employees')
            .select(`
                id,
                full_name,
                username,
                role_id,
                branch,
                manager_id,
                roles (
                    role_name,
                    role_name_ar,
                    evaluation_level
                )
            `)
            .eq('username', username)
            .eq('password_hash', password)
            .eq('is_active', true)
            .single();

        if (error || !user) {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }

        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return { success: true, user };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// التحقق من تسجيل الدخول
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// ============================================================
// دوال الموظفين
// ============================================================

// الحصول على الموظفين حسب الصلاحية
async function getEmployees() {
    const currentUser = getCurrentUser();
    if (!currentUser) return { data: null, error: 'يجب تسجيل الدخول أولاً' };

    try {
        let query = supabase
            .from('employees')
            .select(`
                id,
                full_name,
                username,
                branch,
                role_id,
                manager_id,
                is_active,
                roles (
                    role_name_ar,
                    evaluation_level
                )
            `)
            .eq('is_active', true);

        // إذا لم يكن مدير عام، يرى موظفي فرعه فقط
        if (currentUser.role_id !== 5) {
            query = query.eq('branch', currentUser.branch);
        }

        const { data, error } = await query.order('full_name');

        return { data, error };
    } catch (error) {
        console.error('خطأ في جلب الموظفين:', error);
        return { data: null, error };
    }
}

// الحصول على الموظفين الذين يمكن تقييمهم
async function getEmployeesToEvaluate() {
    const currentUser = getCurrentUser();
    if (!currentUser) return { data: null, error: 'يجب تسجيل الدخول أولاً' };

    try {
        let query = supabase
            .from('employees')
            .select(`
                id,
                full_name,
                username,
                branch,
                role_id,
                roles (
                    role_name_ar,
                    evaluation_level
                )
            `)
            .eq('is_active', true)
            .eq('manager_id', currentUser.id); // الموظفين تحت إشرافه مباشرة

        const { data, error } = await query.order('full_name');

        return { data, error };
    } catch (error) {
        console.error('خطأ في جلب الموظفين:', error);
        return { data: null, error };
    }
}

// ============================================================
// دوال الأسئلة
// ============================================================

// الحصول على أسئلة التقييم حسب المستوى
async function getQuestions(levelId) {
    try {
        const { data, error } = await supabase
            .from('evaluation_questions')
            .select('*')
            .eq('level_id', levelId)
            .eq('is_active', true)
            .order('question_order');

        return { data, error };
    } catch (error) {
        console.error('خطأ في جلب الأسئلة:', error);
        return { data: null, error };
    }
}

// ============================================================
// دوال التقييم
// ============================================================

// حفظ تقييم كامل
async function saveEvaluation(evaluationData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, message: 'يجب تسجيل الدخول أولاً' };

    try {
        const { 
            employeeId, 
            cycleId, 
            answers, // array of { questionId, score, comment }
            finalComment,
            recommendation
        } = evaluationData;

        // 1. حفظ إجابات كل سؤال
        const results = answers.map(answer => ({
            cycle_id: cycleId,
            evaluated_employee_id: employeeId,
            evaluator_id: currentUser.id,
            question_id: answer.questionId,
            score: answer.score,
            comment: answer.comment || null
        }));

        const { error: resultsError } = await supabase
            .from('evaluation_results')
            .insert(results);

        if (resultsError) throw resultsError;

        // 2. حساب المجموع والنسبة
        const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
        const maxScore = answers.length * 10;
        const percentage = (totalScore / maxScore) * 100;

        // 3. حفظ الملخص النهائي
        const { error: summaryError } = await supabase
            .from('evaluation_summary')
            .insert({
                cycle_id: cycleId,
                employee_id: employeeId,
                evaluator_id: currentUser.id,
                total_score: totalScore,
                max_score: maxScore,
                percentage: percentage.toFixed(2),
                grade: getGrade(percentage),
                evaluator_comment: finalComment,
                recommendation: recommendation,
                is_completed: true,
                completed_at: new Date().toISOString()
            });

        if (summaryError) throw summaryError;

        return { success: true, message: 'تم حفظ التقييم بنجاح' };
    } catch (error) {
        console.error('خطأ في حفظ التقييم:', error);
        return { success: false, message: 'حدث خطأ أثناء حفظ التقييم' };
    }
}

// الحصول على تقييمات موظف معين
async function getEmployeeEvaluations(employeeId, cycleId = null) {
    try {
        let query = supabase
            .from('evaluation_summary')
            .select(`
                *,
                evaluator:evaluator_id (full_name),
                cycle:cycle_id (cycle_name)
            `)
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false });

        if (cycleId) {
            query = query.eq('cycle_id', cycleId);
        }

        const { data, error } = await query;

        return { data, error };
    } catch (error) {
        console.error('خطأ في جلب التقييمات:', error);
        return { data: null, error };
    }
}

// الحصول على تفاصيل تقييم محدد
async function getEvaluationDetails(summaryId) {
    try {
        // 1. الحصول على الملخص
        const { data: summary, error: summaryError } = await supabase
            .from('evaluation_summary')
            .select(`
                *,
                employee:employee_id (full_name, branch),
                evaluator:evaluator_id (full_name),
                cycle:cycle_id (cycle_name)
            `)
            .eq('id', summaryId)
            .single();

        if (summaryError) throw summaryError;

        // 2. الحصول على الإجابات التفصيلية
        const { data: results, error: resultsError } = await supabase
            .from('evaluation_results')
            .select(`
                *,
                question:question_id (question_text, category)
            `)
            .eq('cycle_id', summary.cycle_id)
            .eq('evaluated_employee_id', summary.employee_id)
            .eq('evaluator_id', summary.evaluator_id);

        if (resultsError) throw resultsError;

        return { 
            data: { summary, results }, 
            error: null 
        };
    } catch (error) {
        console.error('خطأ في جلب تفاصيل التقييم:', error);
        return { data: null, error };
    }
}

// ============================================================
// دوال الدورات
// ============================================================

// الحصول على الدورة النشطة
async function getActiveCycle() {
    try {
        const { data, error } = await supabase
            .from('evaluation_cycles')
            .select('*')
            .eq('is_active', true)
            .single();

        return { data, error };
    } catch (error) {
        console.error('خطأ في جلب الدورة النشطة:', error);
        return { data: null, error };
    }
}

// الحصول على كل الدورات
async function getAllCycles() {
    try {
        const { data, error } = await supabase
            .from('evaluation_cycles')
            .select('*')
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        console.error('خطأ في جلب الدورات:', error);
        return { data: null, error };
    }
}

// ============================================================
// دوال مساعدة
// ============================================================

// حساب التقدير من النسبة المئوية
function getGrade(percentage) {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'يحتاج تحسين';
    return 'ضعيف';
}

// الحصول على لون التقدير
function getGradeColor(grade) {
    const colors = {
        'ممتاز': '#10b981',
        'جيد جداً': '#3b82f6',
        'جيد': '#f59e0b',
        'يحتاج تحسين': '#ef4444',
        'ضعيف': '#dc2626'
    };
    return colors[grade] || '#6b7280';
}

// إحصائيات Dashboard
async function getDashboardStats() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    try {
        // إحصائيات حسب الصلاحية
        if (currentUser.role_id === 5) {
            // المدير العام يرى كل شيء
            const [employees, cycles, evaluations] = await Promise.all([
                supabase.from('employees').select('id', { count: 'exact' }).eq('is_active', true),
                supabase.from('evaluation_cycles').select('id', { count: 'exact' }),
                supabase.from('evaluation_summary').select('id', { count: 'exact' })
            ]);

            return {
                totalEmployees: employees.count || 0,
                totalCycles: cycles.count || 0,
                totalEvaluations: evaluations.count || 0
            };
        } else {
            // الموظفين الآخرين يروا إحصائياتهم فقط
            const evaluations = await supabase
                .from('evaluation_summary')
                .select('*')
                .eq('employee_id', currentUser.id);

            return {
                myEvaluations: evaluations.data?.length || 0,
                lastGrade: evaluations.data?.[0]?.grade || 'لا يوجد'
            };
        }
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return null;
    }
}