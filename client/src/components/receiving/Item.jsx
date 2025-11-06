import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css"

export default function Item({ meta }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const audioRef = useRef();

    useEffect(() => {
        if (meta?.url) {
            setAudioUrl(meta.url);
            return;
        }
        if (!meta?.file) return;
        const url = URL.createObjectURL(meta.file);
        setAudioUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [meta?.file, meta?.url]);

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
                await a.play();   
            } else {
                a.pause();
            }
        } catch (err) {
            console.error("Audio play failed:", err);
        }
    };

    const handleDownload = async () => {
        try {
        setDownloading(true);

        const filename =
            meta?.fileName ||
            `audio.${meta?.format || (meta?.file?.name?.split(".").pop() || "mp3")}`;

        // 1) Nếu đang là File local
        if (meta?.file instanceof File) {
            const blobUrl = URL.createObjectURL(meta.file);
            triggerDownload(blobUrl, filename);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
            return;
        }

        // 2) Nếu là URL (Cloudinary signed URL, …)
        if (audioUrl) {
            // dùng fetch -> blob để tránh bị chặn download trên URL cross-origin
            const res = await fetch(audioUrl, { mode: "cors" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            triggerDownload(blobUrl, filename);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
            return;
        }
        } catch (e) {
        console.error("Download failed:", e);
        // Fallback: mở tab mới cho trình duyệt tự xử lý
        if (audioUrl) window.open(audioUrl, "_blank", "noopener");
        } finally {
        setDownloading(false);
        }
    };

    function triggerDownload(url, filename) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    return (
        <div>
            <div className={styles.receivedContent}>
                <div className={styles.audioIconContainer}>
                    <AudioIcon size={28} color={'var(--primary)'} />
                </div>
                <div className={styles.fileInfor}>
                    <span className={styles.fileName} >{meta.fileName}</span>
                    <span className={styles.fileSize} >{meta.sizeText} {meta.durationText}</span>
                </div>

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
                
                <div className={styles.btnDownload} onClick={handleDownload} >
                    {downloading ? (
                        <LoadingIcon size={18} color={'var(--primary-foreground)'} />
                    ) : (
                        <DownloadIcon size={18} color={'var(--primary-foreground)'} />
                    )}

                    <span>Download</span>
                </div>
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

function DownloadIcon({ size, color }) {
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
            className="lucide lucide-download w-4 h-4 mr-2"
            >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1={12} x2={12} y1={15} y2={3} />
        </svg>
    )
}

function AudioIcon({ size, color }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            >
            <g id="SVGRepo_bgCarrier" strokeWidth={0} />
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
            <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V7C19 7.55228 19.4477 8 20 8C20.5523 8 21 7.55228 21 7V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM12.5 24C13.8807 24 15 22.8807 15 21.5V12.8673L20 12.153V18.05C19.8384 18.0172 19.6712 18 19.5 18C18.1193 18 17 19.1193 17 20.5C17 21.8807 18.1193 23 19.5 23C20.8807 23 22 21.8807 22 20.5V11C22 10.7101 21.8742 10.4345 21.6552 10.2445C21.4362 10.0546 21.1456 9.96905 20.8586 10.0101L13.8586 11.0101C13.3659 11.0804 13 11.5023 13 12V19.05C12.8384 19.0172 12.6712 19 12.5 19C11.1193 19 10 20.1193 10 21.5C10 22.8807 11.1193 24 12.5 24Z"
                fill={color}
                />{" "}
            </g>
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
