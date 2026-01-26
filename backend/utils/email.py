"""
Email utilities using Resend for TATVGYA
"""
import os
import asyncio
import logging
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send an email using Resend"""
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "status": "success",
            "message": f"Email sent to {to_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


async def send_otp_email(to_email: str, otp_code: str, purpose: str = "signup") -> dict:
    """Send OTP verification email"""
    subject = "TATVGYA - Verify Your Email"
    if purpose == "reset_password":
        subject = "TATVGYA - Reset Your Password"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Manrope', Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background-color: #0A0A0A; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo h1 {{ color: #FFB800; font-size: 32px; letter-spacing: 8px; margin: 0; }}
            .otp-box {{ background-color: #1F1F1F; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }}
            .otp-code {{ font-size: 36px; font-weight: bold; color: #FFB800; letter-spacing: 8px; margin: 0; }}
            .message {{ color: #A1A1AA; line-height: 1.6; }}
            .footer {{ margin-top: 30px; text-align: center; color: #71717A; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>TATVGYA</h1>
            </div>
            <p class="message">
                {'Welcome to TATVGYA! Please use the following OTP to verify your email address:' if purpose == 'signup' else 'You requested to reset your password. Use the following OTP to proceed:'}
            </p>
            <div class="otp-box">
                <p class="otp-code">{otp_code}</p>
            </div>
            <p class="message">
                This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <div class="footer">
                <p>© 2024 TATVGYA - Unlocking Wisdom, Connecting Minds</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)


async def send_contact_notification(admin_email: str, query: dict) -> dict:
    """Send notification to admin about new contact query"""
    subject = f"New Contact Query: {query.get('subject', 'No Subject')}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Manrope', Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }}
            .header {{ border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px; }}
            .header h2 {{ color: #FFB800; margin: 0; }}
            .field {{ margin-bottom: 15px; }}
            .label {{ color: #71717A; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }}
            .value {{ color: #ffffff; }}
            .message-box {{ background-color: #1F1F1F; padding: 20px; border-radius: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Contact Query</h2>
            </div>
            <div class="field">
                <div class="label">From</div>
                <div class="value">{query.get('name', 'N/A')} ({query.get('email', 'N/A')})</div>
            </div>
            <div class="field">
                <div class="label">Subject</div>
                <div class="value">{query.get('subject', 'N/A')}</div>
            </div>
            <div class="message-box">
                <div class="label">Message</div>
                <div class="value">{query.get('message', 'N/A')}</div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(admin_email, subject, html_content)


async def send_educator_credentials(to_email: str, name: str, password: str) -> dict:
    """Send educator account credentials"""
    subject = "TATVGYA - Your Educator Account Credentials"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Manrope', Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background-color: #0A0A0A; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo h1 {{ color: #FFB800; font-size: 32px; letter-spacing: 8px; margin: 0; }}
            .credentials {{ background-color: #1F1F1F; padding: 20px; border-radius: 12px; margin: 20px 0; }}
            .field {{ margin-bottom: 15px; }}
            .label {{ color: #71717A; font-size: 12px; }}
            .value {{ color: #ffffff; font-size: 16px; }}
            .message {{ color: #A1A1AA; line-height: 1.6; }}
            .warning {{ color: #F59E0B; font-size: 14px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>TATVGYA</h1>
            </div>
            <p class="message">
                Welcome to TATVGYA, {name}! Your educator account has been created.
            </p>
            <div class="credentials">
                <div class="field">
                    <div class="label">Email</div>
                    <div class="value">{to_email}</div>
                </div>
                <div class="field">
                    <div class="label">Password</div>
                    <div class="value">{password}</div>
                </div>
            </div>
            <p class="warning">
                Please change your password after your first login for security.
            </p>
            <p class="message">
                You can now log in and start creating educational content!
            </p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)
