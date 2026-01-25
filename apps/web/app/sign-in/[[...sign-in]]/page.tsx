import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black relative">
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />
            <div className="relative z-10">
                <SignIn />
            </div>
        </div>
    );
}
