import { sendEmail } from './lib/email.js'

async function test() {
  const success = await sendEmail({
    to: 'sayedelshazly2006@gmail.com',
    subject: 'Test Email',
    body: 'This is a test email from the server.',
  })
  console.log('Send success:', success)
}
test()
