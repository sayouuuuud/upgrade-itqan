export default function PrivacyPage() {
    return (
        <div className="bg-background min-h-[80vh] py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/40">
                    <h1 className="text-3xl font-black text-foreground mb-8 text-center">سياسة الخصوصية</h1>

                    <div className="space-y-8 text-right font-medium text-muted-foreground leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">1. جمع المعلومات</h2>
                            <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في المنصة، مثل الاسم، البريد الإلكتروني، والجنس. كما نقوم بجمع التسجيلات الصوتية التي ترفعها لغرض التقييم.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">2. استخدام المعلومات</h2>
                            <p>نستخدم المعلومات لتحسين خدماتنا، وتسهيل عملية التواصل بين الطالب والمقرئ، وتخصيص تجربتك التعليمية، وإصدار الشهادات.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">3. حماية البيانات</h2>
                            <p>نحن نتخذ إجراءات أمنية صارمة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">4. مشاركة المعلومات</h2>
                            <p>لا نقوم ببيع أو تأجير معلوماتك الشخصية لأطراف ثالثة. تتم مشاركة بياناتك فقط مع المقرئين المعتمدين والمشرفين لغرض تقديم الخدمة التعليمية.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">5. تواصل معنا</h2>
                            <p>إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يمكنك التواصل معنا عبر نموذج "تواصل معنا" المتاح في المنصة.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
