import Script from 'next/script'

interface SchemaProps {
    type: 'website' | 'organization' | 'course' | 'breadcrumb' | 'faq' | 'article'
    data?: Record<string, any>
    breadcrumbs?: { name: string; url: string }[]
    faqs?: { question: string; answer: string }[]
}

export function JsonLdSchema({ type, data = {}, breadcrumbs = [], faqs = [] }: SchemaProps) {
    let schema: Record<string, any> = {}

    switch (type) {
        case 'organization':
            schema = {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'متقن الفاتحة',
                url: 'https://itqaan.com',
                logo: 'https://itqaan.com/logo.png',
                sameAs: [],
                description: 'منصة تعليمية لتحسين تلاوة القرآن الكريم مع مقرئين معتمدين',
                ...data,
            }
            break
        case 'website':
            schema = {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'متقن الفاتحة',
                url: 'https://itqaan.com',
                potentialAction: {
                    '@type': 'SearchAction',
                    target: { '@type': 'EntryPoint', urlTemplate: 'https://itqaan.com/search?q={search_term_string}' },
                    'query-input': 'required name=search_term_string',
                },
                ...data,
            }
            break
        case 'breadcrumb':
            schema = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((item, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: item.name,
                    item: item.url,
                })),
            }
            break
        case 'course':
            schema = {
                '@context': 'https://schema.org',
                '@type': 'Course',
                name: 'متقن سورة الفاتحة',
                description: 'تعلم متقن سورة الفاتحة مع مقرئين معتمدين',
                provider: {
                    '@type': 'Organization',
                    name: 'متقن الفاتحة',
                    sameAs: 'https://itqaan.com',
                },
                inLanguage: 'ar',
                isAccessibleForFree: false,
                ...data,
            }
            break
        case 'faq':
            schema = {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
            }
            break
        case 'article':
            schema = {
                '@context': 'https://schema.org',
                '@type': 'Article',
                publisher: {
                    '@type': 'Organization',
                    name: 'متقن الفاتحة',
                    logo: { '@type': 'ImageObject', url: 'https://itqaan.com/logo.png' },
                },
                ...data,
            }
            break
    }

    return (
        <Script
            id={`schema-${type}-${Math.random().toString(36).slice(2, 7)}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    )
}

// Convenience exports
export const WebsiteSchema = () => <JsonLdSchema type="website" />
export const OrganizationSchema = () => <JsonLdSchema type="organization" />
export const BreadcrumbSchema = (props: { items: { name: string; url: string }[] }) =>
    <JsonLdSchema type="breadcrumb" breadcrumbs={props.items} />
