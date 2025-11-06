import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css"

export default function Item({ meta, shareOnClick, isLoading }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef();

    useEffect(() => {
        if (!meta?.file) return;
        const url = URL.createObjectURL(meta.file);
        setAudioUrl(url);
        return () => URL.revokeObjectURL(url); // chỉ revoke khi file đổi hoặc unmount
    }, [meta?.file]);

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);
        a.addEventListener("play", onPlay);
        a.addEventListener("pause", onPause);
        a.addEventListener("ended", onEnded);
        return () => {
        a.removeEventListener("play", onPlay);
        a.removeEventListener("pause", onPause);
        a.removeEventListener("ended", onEnded);
        };
    }, []);

    const handleToggle = async () => {
        const a = audioRef.current;
        if (!a) return;
        try {
            if (a.paused) {
                await a.play();   // xử lý promise để bắt lỗi policy nếu có
            } else {
                a.pause();
            }
        } catch (err) {
            console.error("Audio play failed:", err);
        }
    };

    return (
        <div>
            <div className={styles.uploadContent}>
                <span className={styles.fileName} >{meta.fileName}</span>
                <span className={styles.fileSize} >{meta.sizeText}</span>
            </div>
            
            <audio 
                ref={audioRef} 
                src={audioUrl ?? undefined} 
                preload="auto" />

            <div className={styles.buttonGroup}>
                <div className={styles.btnPrv} onClick={handleToggle}>
                    {isPlaying ? (
                        <>
                            <PauseIcon size={18} color={'var(--primary-foreground)'} />
                            <span>Pause</span>
                        </>
                    ) : (
                        <>
                            <PlayIcon size={18} color={'var(--primary-foreground)'} />
                            <span>Play</span>
                        </>
                    )}
                </div>
                
                <div className={styles.btnChange} >
                    <span>Change</span>
                </div>
            </div>

            <div className={styles.btnShare} onClick={shareOnClick} >
                {isLoading ? (
                    <LoadingIcon size={18} color={'var(--primary-foreground)'}/>
                ) : (
                    <ShareIcon size={18} color={'var(--primary-foreground)'} />
                )}
                <span>Share File</span>
            </div>
        </div>
    )
} 

function PlayIcon({ size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-play w-4 h-4 mr-2"
            >
            <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
    )
}

function PauseIcon({ size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-pause w-4 h-4 mr-2"
        >
            <rect x={14} y={4} width={4} height={16} rx={1} />
            <rect x={6} y={4} width={4} height={16} rx={1} />
        </svg>
    )
}

function ShareIcon({ size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-send w-4 h-4 mr-2"
            >
            <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
            <path d="m21.854 2.147-10.94 10.939" />
        </svg>
    )
}

function LoadingIcon({ size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid"
            width={size}
            height={size}
            style={{
                shapeRendering: "auto",
                display: "block",
                background: "transparent"
            }}
        >
            <g>
                <circle
                strokeLinecap="round"
                fill="none"
                strokeDasharray="50.26548245743669 50.26548245743669"
                stroke={color}
                strokeWidth={8}
                r={32}
                cy={50}
                cx={50}
                >
                <animateTransform
                    values="0 50 50;360 50 50"
                    keyTimes="0;1"
                    dur="1s"
                    repeatCount="indefinite"
                    type="rotate"
                    attributeName="transform"
                />
                </circle>
                <g />
            </g>
            {/* [ldio] generated by https://loading.io */}
        </svg>
    )

}