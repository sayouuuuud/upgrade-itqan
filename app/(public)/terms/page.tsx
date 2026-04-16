export default function TermsPage() {
    return (
        <div className="bg-background min-h-[80vh] py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/40">
                    <h1 className="text-3xl font-black text-foreground mb-8 text-center">شروط الاستخدام</h1>

                    <div className="space-y-8 text-right font-medium text-muted-foreground leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">1. قبول الشروط</h2>
                            <p>باستخدامك لمنصة إتقان، فإنك توافق على الالتزام بشروط الاستخدام هذه وكافة القوانين واللوائح المعمول بها.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">2. الخدمات المقدمة</h2>
                            <p>منصة إتقان هي منصة تعليمية تهدف لتصحيح تلاوة القرآن الكريم. نحن نقدم خدمات التواصل بين الطلاب والمقرئين المعتمدين.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">3. سلوك المستخدم</h2>
                            <p>يلتزم المستخدم بحسن التعامل مع المقرئين وبالآداب الإسلامية العامة خلال الجلسات التعليمية. يمنع استخدام المنصة لأي أغراض خارج الإطار التعليمي المخصص لها.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">4. الخصوصية والأمان</h2>
                            <p>نحن نلتزم بحماية بياناتك الشخصية وتسجيلاتك الصوتية. تتوفر تفاصيل إضافية في صفحة سياسة الخصوصية.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">5. التعديلات</h2>
                            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال المنصة.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
