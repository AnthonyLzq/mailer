import nodemailer from 'nodemailer'

import { getBlackList } from './database'

const EMAIL = process.env.EMAIL as string
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD as string

const mailer = async ({
  from,
  subject,
  text,
  html = ''
}: {
  from: string
  subject: string
  text?: string
  html?: string | Buffer
}): Promise<boolean> => {
  try {
    const blacklist = await getBlackList()

    if (blacklist.includes(from)) return true

    const transporter = nodemailer.createTransport({
      auth: {
        user: EMAIL,
        pass: EMAIL_PASSWORD
      },
      host: 'smtp.gmail.com',
      secure: true,
      port: 465
    })
    const mailOptions = {
      from: `AnthonyLzq <${EMAIL}>`,
      html,
      sender: EMAIL,
      subject: 'Message from your website',
      text: `Subject: ${subject} - ${from}\n\n${text}`,
      to: EMAIL
    }
    await transporter.sendMail(mailOptions)

    return true
  } catch (error) {
    console.log('Error while trying to send the mail')
    console.error(error)

    return false
  }
}

export { mailer }
