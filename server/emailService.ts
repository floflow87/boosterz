import { MailService } from '@sendgrid/mail';

class EmailService {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured, skipping email send');
      return false;
    }

    const verificationUrl = `${process.env.REPLIT_DOMAINS || 'localhost:5000'}/verify-email?token=${token}`;

    try {
      await this.mailService.send({
        to: email,
        from: 'noreply@boosterz.app', // À remplacer par ton domaine vérifié
        subject: 'Confirme ton inscription à BOOSTERZ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: white; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ffd700; font-size: 2.5rem; margin: 0; font-family: 'Luckiest Guy', cursive;">BOOSTERZ</h1>
            </div>
            
            <h2 style="color: #ffd700; text-align: center;">Bienvenue dans l'aventure !</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Salut <strong>${username}</strong> !
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Merci de t'être inscrit(e) sur BOOSTERZ, l'application ultime pour collectionner et échanger des cartes !
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Pour finaliser ton inscription et commencer à collectionner, confirme ton adresse email en cliquant sur le bouton ci-dessous :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #ffd700; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Confirmer mon email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #cccccc; text-align: center;">
              Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br>
              <a href="${verificationUrl}" style="color: #ffd700;">${verificationUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Si tu n'as pas créé de compte sur BOOSTERZ, ignore cet email.
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();