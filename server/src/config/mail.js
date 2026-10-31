import nodemailer from 'nodemailer';

export const mailConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.MAIL_FROM || 'Brightloop <no-reply@brightloop.test>',
};

let transporter = null;

if (mailConfig.host && mailConfig.auth.user) {
  transporter = nodemailer.createTransport(mailConfig);
}

export { transporter };
