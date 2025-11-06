import { useState } from "react";

import styles from "./styles.module.css"

export default function ShareLink({ link }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
        await navigator.clipboard.writeText(link);
        setCopied(true);

        // Reset trạng thái sau 2 giây
        setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        console.error("Copy failed:", err);
        }
    };
    return (
        <div style={container}>
            <span style={title}>Shareable Link:</span>
            <div style={shareContent}>
                <input style={linkStyle} value={link} readOnly />
                <div className={styles.btnCopy} onClick={handleCopy}>
                    {copied ? (
                        <CopiedIcon size={18} color={'var(--primary-foreground)'}/>
                    ) : (
                        <CopyIcon size={18} color={'var(--primary-foreground)'}/>
                    )}

                </div>
            </div>
        </div>
    )
}

const container = {
    width: '100%',
    padding: 12,
    boderRadius: 12,
    border: '1px dashed var(--border)',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 14,
}

const title = {
    fontWeight: 500
}

const shareContent = {
    display: 'flex',
    gap: 12,
}

const linkStyle = {
    padding: 12,
    flex: 1,
    backgroundColor: 'transparent',
    color: 'inherit',
    border: 'none'
}

function CopyIcon({ size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-copy w-4 h-4"
            >
            <rect width={14} height={14} x={8} y={8} rx={2} ry={2} />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    )
}

function CopiedIcon({ size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-check w-4 h-4"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}