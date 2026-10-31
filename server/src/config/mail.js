// Mail config placeholder – to be implemented in later milestones
import { env } from './env.js';

export const mailConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.MAIL_FROM || 'noreply@brightloop.app',
};

