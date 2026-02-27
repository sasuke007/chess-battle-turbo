"use client";

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Page() {
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect_url') || '/';

    return (
        <div className="flex items-center justify-center min-h-screen bg-black relative overflow-hidden">
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

            {/* Decorative corner elements */}
            <div className="absolute top-8 left-8 w-24 h-24 border-l border-t border-white/10" />
            <div className="absolute top-8 right-8 w-24 h-24 border-r border-t border-white/10" />
            <div className="absolute bottom-8 left-8 w-24 h-24 border-l border-b border-white/10" />
            <div className="absolute bottom-8 right-8 w-24 h-24 border-r border-b border-white/10" />

            {/* Content container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo/Brand */}
                <Link href="/" className="mb-12 group">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border border-white/20 flex items-center justify-center mb-4 group-hover:border-white/40 group-hover:bg-white/5 transition-all duration-300">
                            <span className="text-white text-3xl">♔</span>
                        </div>
                        <h1
                            style={{ fontFamily: "'Instrument Serif', serif" }}
                            className="text-3xl text-white tracking-tight"
                        >
                            ReplayChess
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="h-px w-8 bg-white/20" />
                            <span
                                style={{ fontFamily: "'Geist', sans-serif" }}
                                className="text-white/30 text-[9px] tracking-[0.3em] uppercase"
                            >
                                Welcome Back
                            </span>
                            <div className="h-px w-8 bg-white/20" />
                        </div>
                    </div>
                </Link>

                {/* Clerk SignIn with custom appearance */}
                <SignIn
                    fallbackRedirectUrl={redirectUrl}
                    appearance={{
                        variables: {
                            colorBackground: '#000000',
                            colorText: '#ffffff',
                            colorTextSecondary: 'rgba(255, 255, 255, 0.5)',
                            colorTextOnPrimaryBackground: '#000000',
                            colorPrimary: '#ffffff',
                            colorInputBackground: 'rgba(255, 255, 255, 0.03)',
                            colorInputText: '#ffffff',
                            colorNeutral: 'rgba(255, 255, 255, 0.4)',
                            colorDanger: '#ef4444',
                            borderRadius: '0px',
                            fontFamily: "'Geist', sans-serif",
                            fontFamilyButtons: "'Geist', sans-serif",
                            fontSize: '14px',
                            spacingUnit: '16px',
                        },
                        elements: {
                            // Root card
                            rootBox: {
                                width: '100%',
                                maxWidth: '400px',
                            },
                            card: {
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: 'none',
                                padding: '32px',
                            },
                            // Header
                            headerTitle: {
                                fontFamily: "'Instrument Serif', serif",
                                fontSize: '28px',
                                fontWeight: '400',
                                color: '#ffffff',
                                textAlign: 'center' as const,
                            },
                            headerSubtitle: {
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '13px',
                                color: 'rgba(255, 255, 255, 0.4)',
                                textAlign: 'center' as const,
                            },
                            // Social buttons
                            socialButtonsBlockButton: {
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '13px',
                                fontWeight: '500',
                                letterSpacing: '0.02em',
                                padding: '12px 16px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                            },
                            socialButtonsBlockButtonText: {
                                fontFamily: "'Geist', sans-serif",
                                fontWeight: '500',
                            },
                            socialButtonsProviderIcon: {
                                filter: 'brightness(0) invert(1)',
                                opacity: '0.8',
                            },
                            // Divider
                            dividerLine: {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            dividerText: {
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '10px',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase' as const,
                                color: 'rgba(255, 255, 255, 0.3)',
                            },
                            // Form fields
                            formFieldLabel: {
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '10px',
                                fontWeight: '500',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase' as const,
                                color: 'rgba(255, 255, 255, 0.5)',
                                marginBottom: '8px',
                            },
                            formFieldInput: {
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '14px',
                                padding: '14px 16px',
                                transition: 'all 0.3s ease',
                                '&:focus': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    outline: 'none',
                                    boxShadow: 'none',
                                },
                                '&::placeholder': {
                                    color: 'rgba(255, 255, 255, 0.2)',
                                },
                            },
                            formFieldInputShowPasswordButton: {
                                color: 'rgba(255, 255, 255, 0.4)',
                                '&:hover': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                },
                            },
                            // Primary button
                            formButtonPrimary: {
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '13px',
                                fontWeight: '600',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase' as const,
                                padding: '14px 24px',
                                border: 'none',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                },
                                '&:active': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                                },
                            },
                            // Links
                            footerActionLink: {
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '13px',
                                color: '#ffffff',
                                fontWeight: '500',
                                textDecoration: 'none',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                                paddingBottom: '2px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: '#ffffff',
                                },
                            },
                            footerActionText: {
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '13px',
                                color: 'rgba(255, 255, 255, 0.4)',
                            },
                            // Footer
                            footer: {
                                '& + div': {
                                    display: 'none',
                                },
                            },
                            footerAction: {
                                marginTop: '24px',
                            },
                            // Identity preview
                            identityPreview: {
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            },
                            identityPreviewText: {
                                fontFamily: "'Geist', sans-serif",
                                color: '#ffffff',
                            },
                            identityPreviewEditButton: {
                                color: 'rgba(255, 255, 255, 0.5)',
                                '&:hover': {
                                    color: '#ffffff',
                                },
                            },
                            // Alerts
                            alert: {
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ffffff',
                            },
                            alertText: {
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '13px',
                            },
                            // OTP input
                            otpCodeFieldInput: {
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                fontFamily: "'Geist', sans-serif",
                                '&:focus': {
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                },
                            },
                            // Form resend code link
                            formResendCodeLink: {
                                fontFamily: "'Geist', sans-serif",
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '12px',
                                '&:hover': {
                                    color: '#ffffff',
                                },
                            },
                            // Back link
                            backLink: {
                                fontFamily: "'Geist', sans-serif",
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontSize: '13px',
                                '&:hover': {
                                    color: '#ffffff',
                                },
                            },
                            // Alternative methods
                            alternativeMethodsBlockButton: {
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontFamily: "'Geist', sans-serif",
                                fontSize: '12px',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#ffffff',
                                },
                            },
                            // Internal elements
                            internal: {
                                display: 'none',
                            },
                            // Badge (for secured by Clerk)
                            badge: {
                                display: 'none',
                            },
                            // Form header
                            formHeader: {
                                display: 'none',
                            },
                        },
                        layout: {
                            socialButtonsPlacement: 'top',
                            socialButtonsVariant: 'blockButton',
                            showOptionalFields: false,
                            shimmer: false,
                        },
                    }}
                />

                {/* Bottom decorative text */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-white/10" />
                        <span
                            style={{ fontFamily: "'Geist', sans-serif" }}
                            className="text-white/20 text-[9px] tracking-[0.3em] uppercase"
                        >
                            Secure Authentication
                        </span>
                        <div className="h-px w-12 bg-white/10" />
                    </div>
                </div>
            </div>
        </div>
    );
}
