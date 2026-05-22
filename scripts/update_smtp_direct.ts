import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lrrhqjvgippgrlcozrvr.supabase.co'
const supabaseServiceKey = 'sb_secret_5ry4eQOGryzXty5QueNypQ_E3TUxSnE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const newConfig = {
    host: "smtp.gmail.com",
    port: 465,
    user: "sayedxiv@gmail.com",
    secure: true,
    password: "qdjdbfsmmlqgwoqd",
    fromName: "إتقان التعليمية",
    fromEmail: "sayedxiv@gmail.com"
}

async function main() {
    const { data, error } = await supabase
        .from('system_settings')
        .update({ setting_value: newConfig, updated_at: new Date().toISOString() })
        .eq('setting_key', 'smtp_config')
        .select()

    if (error) {
        console.error('ERROR:', error)
    } else if (!data || data.length === 0) {
        // Row doesn't exist, insert it
        const { error: insertError } = await supabase
            .from('system_settings')
            .insert({ setting_key: 'smtp_config', setting_value: newConfig })
        if (insertError) {
            console.error('INSERT ERROR:', insertError)
        } else {
            console.log('SUCCESS: SMTP configuration inserted.')
        }
    } else {
        console.log('SUCCESS: SMTP configuration updated.', data)
    }
}

main()
