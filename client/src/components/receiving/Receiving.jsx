import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Item from "./Item";

export default function Receiving({ token }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    const load = async () => {
      try {
        setError(null);
        const res = await fetch(`http://localhost:3001/api/shares/${token}`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to load');
        }
        const data = await res.json();
        setMeta({
          fileName: data?.file?.name || 'audio',
          sizeBytes: data?.file?.bytes,
          sizeText: formatBytes(data?.file?.bytes),
          durationSec: data?.file?.duration,
          durationText: formatDuration(data?.file?.duration || 0),
          type: 'audio/mpeg',
          url: data?.playUrl,
        });
      } catch (e) {
        setError(e.message || 'Error');
      }
    };
    if (token) load();
  }, [token]);

  return (
    <div className={styles.bg}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>MP3 Share</h2>
          <span>Share and receive audio files</span>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Receive Audio</h2>
            <span className={styles.subTitle}>Your audio</span>
          </div>

          {error && (
            <div style={{ color: 'var(--destructive)' }}>{error}</div>
          )}

          {meta && <Item meta={meta} />}
        </div>
      </div>
    </div>
  );
}
