"""
email.py — Email notification service using smtplib.

Configuration is loaded from .env:
    SMTP_HOST     (default: smtp.gmail.com)
    SMTP_PORT     (default: 587)
    SMTP_USER     sender email address
    SMTP_PASSWORD sender email password / app password
    EMAILS_ENABLED (default: false — set to true in production)

When EMAILS_ENABLED is false the service just logs the email to the console
so tests and local dev don't need real SMTP credentials.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SMTP_HOST       = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER       = os.getenv("SMTP_USER", "")
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD", "")
EMAILS_ENABLED  = os.getenv("EMAILS_ENABLED", "false").lower() == "true"
FRONTEND_URL    = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _send(to: str, subject: str, html_body: str) -> None:
    """Internal helper — sends an HTML email or logs it if emails are disabled."""
    if not EMAILS_ENABLED:
        logger.info(
            "[EMAIL DISABLED] To: %s | Subject: %s\n%s",
            to, subject, html_body
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = SMTP_USER
    msg["To"]      = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to, msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as exc:
        # Never let email errors crash the main request
        logger.error("Failed to send email to %s: %s", to, exc)


# ── Public notification functions ────────────────────────────────────────────

def send_application_approved(to_email: str, full_name: str) -> None:
    """Notify a student that their application has been approved."""
    subject = "🎉 Votre demande d'admission a été acceptée — Internat"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#2e7d32;">Félicitations, {full_name} !</h2>
      <p>Nous avons le plaisir de vous informer que votre demande d'admission
         à l'internat a été <strong style="color:#2e7d32;">acceptée</strong>.</p>
      <p>Vous pouvez consulter votre statut en vous connectant à votre espace :</p>
      <a href="{FRONTEND_URL}" style="
           display:inline-block;padding:10px 20px;background:#2e7d32;
           color:white;border-radius:5px;text-decoration:none;">
        Mon espace étudiant
      </a>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Internat Admission System — Ne pas répondre à cet e-mail.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)


def send_application_rejected(to_email: str, full_name: str) -> None:
    """Notify a student that their application has been rejected."""
    subject = "Information concernant votre demande d'admission — Internat"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#c62828;">Cher(e) {full_name},</h2>
      <p>Après examen de votre dossier, nous vous informons que votre demande
         d'admission à l'internat a été
         <strong style="color:#c62828;">rejetée</strong>.</p>
      <p>Pour plus d'informations, veuillez contacter l'administration.</p>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Internat Admission System — Ne pas répondre à cet e-mail.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)


def send_application_incomplete(to_email: str, full_name: str, feedback: str) -> None:
    """Notify a student that their application is incomplete and needs correction."""
    subject = "⚠️ Action requise : Votre demande d'admission est incomplète — Internat"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#e91e63;">Cher(e) {full_name},</h2>
      <p>L'administration a examiné votre dossier d'admission à l'internat et a noté qu'il est 
         <strong style="color:#e91e63;">incomplet</strong>.</p>
      <p>Voici le message de l'administrateur :</p>
      <div style="background:#fce4ec;padding:15px;border-left:4px solid #e91e63;margin:15px 0;font-family:monospace;">
        {feedback}
      </div>
      <p>Veuillez vous connecter à votre espace étudiant pour mettre à jour votre dossier au plus vite :</p>
      <a href="{FRONTEND_URL}" style="
           display:inline-block;padding:10px 20px;background:#e91e63;
           color:white;border-radius:5px;text-decoration:none;">
        Corriger mon dossier
      </a>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Internat Admission System — Ne pas répondre à cet e-mail.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)

def send_application_waitlisted(to_email: str, full_name: str) -> None:
    """Notify a student that they are placed on the waitlist."""
    subject = "⏳ Mise en liste d'attente : Votre demande d'admission — Internat"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#673ab7;">Cher(e) {full_name},</h2>
      <p>Nous vous informons que votre dossier d'admission a été <strong style="color:#2e7d32;">approuvé</strong>.</p>
      <p>Cependant, la capacité maximale de l'internat étant atteinte, vous avez été placé(e) sur 
         <strong style="color:#673ab7;">liste d'attente</strong>.</p>
      <p>Une chambre vous sera automatiquement attribuée dès qu'une place se libérera. Vous pouvez suivre votre statut sur votre espace :</p>
      <a href="{FRONTEND_URL}" style="
           display:inline-block;padding:10px 20px;background:#673ab7;
           color:white;border-radius:5px;text-decoration:none;">
        Consulter mon statut
      </a>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Internat Admission System — Ne pas répondre à cet e-mail.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)

def send_password_reset(to_email: str, reset_token: str) -> None:
    """Send a password-reset code to the user."""
    subject   = "Code de réinitialisation de votre mot de passe — Internat"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.
         Voici votre code de vérification (valable <strong>15 minutes</strong>) :</p>
      <div style="background:#f4f6f8;padding:20px;text-align:center;border-radius:5px;margin:20px 0;">
        <h1 style="color:#1565c0;letter-spacing:10px;margin:0;font-size:32px;">{reset_token}</h1>
      </div>
      <p>Entrez ce code dans l'application pour créer un nouveau mot de passe.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Internat Admission System — Ne pas répondre à cet e-mail.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)
def send_otp_email(to_email: str, otp_code: str) -> None:
    """Send a 2FA OTP code to the user."""
    subject   = "Votre code de vérification 2FA — Internat"
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#1e3a8a;">Vérification de Sécurité</h2>
      <p>Pour sécuriser votre accès, veuillez entrer le code de vérification suivant :</p>
      <div style="background:#eff6ff;padding:30px;text-align:center;border-radius:12px;margin:25px 0;border:1px solid #dbeafe;">
        <h1 style="color:#1e3a8a;letter-spacing:12px;margin:0;font-size:42px;fontWeight:bold;">{otp_code}</h1>
      </div>
      <p>Ce code est valable pendant <strong>5 minutes</strong>.</p>
      <p>Si vous n'êtes pas à l'origine de cette tentative de connexion, veuillez ignorer cet e-mail.</p>
      <p style="margin-top:30px;font-size:12px;color:#888;border-top:1px solid #eee;padding-top:15px;">
        © 2026 Internat Admission System — Système de Protection Avancé.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)

def send_custom_email(to_email: str, full_name: str, message: str) -> None:
    """Send a custom message from the admin."""
    subject = "Message de l'administration — Internat"
    # Convert newlines to <br> for HTML rendering
    message_html = message.replace("\n", "<br>")
    body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#333;">
      <h2 style="color:#1976d2;">Bonjour {full_name},</h2>
      <p>L'administration de l'internat vous a envoyé le message suivant :</p>
      <div style="background:#e3f2fd;padding:15px;border-left:4px solid #1976d2;margin:15px 0;">
        {message_html}
      </div>
      <p><b>Pour répondre à ce message ou continuer la conversation</b>, veuillez vous connecter à votre espace étudiant :</p>
      <a href="{FRONTEND_URL}" style="
           display:inline-block;padding:10px 20px;background:#1976d2;
           color:white;border-radius:5px;text-decoration:none;margin-bottom:10px;">
        Ouvrir la messagerie
      </a>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Internat Admission System — Ne pas répondre à cet e-mail.
      </p>
    </body></html>
    """
    _send(to_email, subject, body)

