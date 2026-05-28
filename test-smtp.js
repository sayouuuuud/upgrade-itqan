import nodemailer from 'nodemailer'

const p1 = 'ypvbctjpjdeyqndo'
const p2 = 'qdjdbfsmmlqgwoqd'

async function testPassword(pass) {
  const t = nodemailer.createTransport(`smtps://sayedxiv%40gmail.com:${pass}@smtp.gmail.com:465`)
  try {
    await t.verify()
    console.log(`Password ${pass} is VALID!`)
  } catch(e) {
    console.log(`Password ${pass} FAILED:`, e.message)
  }
}

async function run() {
  await testPassword(p1)
  await testPassword(p2)
}
run()
