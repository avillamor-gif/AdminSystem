import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('[resend] RESEND_API_KEY is not set — emails will not be sent')
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? '')

/** The verified sending address for all system emails */
export const FROM_ADDRESS = 'II Admin System <noreply@iboninternational.org>'
