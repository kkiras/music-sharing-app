import { useEffect, useRef, useState } from "react"
import styles from "./styles.module.css"
import Item from "./Item";
import ShareLink from "./ShareLink";

export default function Sharing() {
    const fileInputRef = useRef(null)
    const [selectedFile, setSelectedFile] = useState(null);
    const [meta, setMeta] = useState(null);
    const [shareUrl, setShareUrl] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    
    const API = import.meta.env.VITE_API_URL

    const handleUploadClick = () => fileInputRef.current.click();

    const handleChangeClick = () => {
        if (isLoading) return;                  // tránh đổi khi đang upload
        // KHÔNG xóa meta trước: nếu user bấm Cancel thì vẫn giữ file cũ
        fileInputRef.current?.click();
    };

    const [isDragging, setIsDragging] = useState(false);

    const onDragOver = (e) => {
        e.preventDefault(); // cho phép drop
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const onDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // chỉ reset khi rời khỏi vùng chính (tránh flicker khi hover icon/span)
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragging(false);
    };

    const onDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;

        // (tuỳ chọn) chỉ nhận audio
        if (!file.type.startsWith("audio/")) {
            alert("Please drop an audio file.");
            return;
        }

        await processFile(file);
    };
    

    // useEffect(() => {
    //     if (meta) console.log("META UPDATED:", meta);
    // }, [meta]);

    const formatBytes = (bytes) => {
        if (!bytes && bytes !== 0) return "";
        const units = ["B", "KB", "MB", "GB"];
        let i = 0, val = bytes;
        while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
        return `${val.toFixed(val < 10 && i > 0 ? 2 : 0)} ${units[i]}`;
    };

    const formatDuration = (sec) => {
        if (!isFinite(sec)) return "";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
                    : `${m}:${String(s).padStart(2,"0")}`;
    };

    const getAudioDuration = (file) =>
        new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio();
        const cleanup = () => URL.revokeObjectURL(url);
        audio.preload = "metadata";
        audio.src = url;
        audio.onloadedmetadata = () => { 
            const dur = audio.duration; cleanup(); resolve(dur); 
        };
        audio.onerror = (e) => { cleanup(); reject(e); };
    });

    const processFile = async (file) => {
        if (!file) return;
        try {
            setSelectedFile(file);
            const duration = await getAudioDuration(file);
            setMeta({
            fileName: file.name,
            sizeBytes: file.size,
            sizeText: formatBytes(file.size),
            durationSec: duration,
            durationText: formatDuration(duration),
            type: file.type,
            lastModified: file.lastModified,
            file
            });
            setShareUrl(""); // đổi file → reset link cũ
        } catch (err) {
            console.error("Read audio metadata failed:", err);
            setSelectedFile(null);
            setMeta(null);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
        // cho phép chọn lại cùng một file
        if (e.target) e.target.value = "";
    };



    const shareOnClick = async () => {
        if (!selectedFile) return;

        setIsLoading(true)

        // 1) xin chữ ký upload
        const sig = await fetch(`${API}/api/upload-signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        }).then(r => r.json());

        console.log(sig)

        const form = new FormData();
        form.append("file", selectedFile);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", sig.timestamp);
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);
        form.append("type", sig.type);                 // "authenticated"
        form.append("access_mode", sig.access_mode);   // "authenticated"

        const uploadResp = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`,
        { method: "POST", body: form }
        );

        if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        console.error("Upload failed:", errText);
        throw new Error("Upload failed");
        }

        const uploadRes = await uploadResp.json();

        // 3) lưu metadata vào DB
        const { fileId } = await fetch(`${API}/api/files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                publicId: uploadRes.public_id,               
                format: uploadRes.format,
                bytes: uploadRes.bytes,
                duration: uploadRes.duration,
                originalFilename: uploadRes.original_filename,
                userId: "123-abc"
            })
        }).then(r => r.json());

        // 4) tạo share link
        const { url } = await fetch(`${API}/api/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId, ttlSeconds: 3600, maxDownloads: 0 })
        }).then(r => r.json());

        setShareUrl(url);
        setIsLoading(false)
    };

    return (
        <div className={styles.bg}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h2>MP3 Share</h2>
                    <span>Share and receive audio files</span>
                </div>

                <div className={styles.cardContent}>
                    <div className={styles.titleGroup}>
                        <h2 className={styles.title}>Share Audio</h2>
                        <span className={styles.subTitle}>Select an MP3 to share</span>
                    </div>

                    {!selectedFile && (
                        <div 
                            className={styles.uploadField} 
                            onClick={handleUploadClick}
                            onDragEnter={onDragEnter}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleUploadClick()}
                        >
                            <UploadIcon size={24} />
                            <span>Choose Audio File</span>
                        
                        </div>
                    )}

                    {meta && <Item meta={meta} shareOnClick={shareOnClick} isLoading={isLoading} onChangeClick={handleChangeClick} />}
                    
                    {shareUrl && <ShareLink link={shareUrl} />}
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="audio/mpeg, audio/mp3"
                        onChange={handleFileChange}
                        className={styles.hiddenInput}
                    />

                </div>
            </div>
        </div>
    )
}

function UploadIcon ({ size}) {
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
                    d="M12.5535 2.49392C12.4114 2.33852 12.2106 2.25 12 2.25C11.7894 2.25 11.5886 2.33852 11.4465 2.49392L7.44648 6.86892C7.16698 7.17462 7.18822 7.64902 7.49392 7.92852C7.79963 8.20802 8.27402 8.18678 8.55352 7.88108L11.25 4.9318V16C11.25 16.4142 11.5858 16.75 12 16.75C12.4142 16.75 12.75 16.4142 12.75 16V4.9318L15.4465 7.88108C15.726 8.18678 16.2004 8.20802 16.5061 7.92852C16.8118 7.64902 16.833 7.17462 16.5535 6.86892L12.5535 2.49392Z"
                    fill="currentColor"
                />{" "}
                <path
                    d="M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z"
                    fill="currentColor"
                />{" "}
            </g>
        </svg>
    )

}
