const fetch = require('node-fetch')

async function testParentApis() {
    const token = process.argv[2] || '';
    if (!token) {
        console.error('Please provide a test session token');
        return;
    }

    const headers = {
        'Cookie': `auth-token=${token}; better-auth.session_token=${token}`
    }

    try {
        console.log('--- Testing GET /api/academy/parent/children ---')
        const childrenRes = await fetch('http://localhost:3000/api/academy/parent/children', { headers })
        console.log('Status:', childrenRes.status)
        const childrenText = await childrenRes.text()
        console.log('Response:', childrenText)

        if (childrenRes.ok) {
            const data = JSON.parse(childrenText)
            const children = data.children || []

            for (const child of children) {
                console.log(`\n--- Testing GET /api/academy/parent/children/${child.child_id}/reports ---`)
                const reportRes = await fetch(`http://localhost:3000/api/academy/parent/children/${child.child_id}/reports`, { headers })
                console.log('Status:', reportRes.status)
                const reportText = await reportRes.text()
                console.log('Response:', reportText.substring(0, 500) + '...')
            }
        }
    } catch (e) {
        console.error('Error:', e)
    }
}

testParentApis()
