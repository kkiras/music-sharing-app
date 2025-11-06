// server.js (CommonJS)

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const cron = require("node-cron");

(async () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "music-sharing-app");

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.post("/api/upload-signature", (req, res) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = process.env.CLOUDINARY_FOLDER || "audio";
      const type = "authenticated";           // delivery type
      const access_mode = "authenticated";    // access control

      const paramsToSign = { timestamp, folder, type, access_mode };
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
      );

      res.json({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        folder,
        type,                          
        access_mode,                   
        resourceType: "video",         
        signature
      });
    });

    app.post("/api/files", async (req, res) => {
      try {
        const { publicId, format, bytes, duration, originalFilename } = req.body;
        const doc = await db.collection("files").insertOne({
          publicId,
          format,
          bytes,
          duration,
          originalFilename,
          createdAt: new Date(),
        });
        res.json({ fileId: doc.insertedId });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });

    app.post("/api/share", async (req, res) => {
      try {
        const { fileId, ttlSeconds = 3600, maxDownloads = 0 } = req.body;
        const file = await db
          .collection("files")
          .findOne({ _id: new ObjectId(fileId) });
        if (!file) return res.status(404).json({ message: "File not found" });

        const token = crypto.randomBytes(6).toString("hex");
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

        await db.collection("shares").insertOne({
          fileId: file._id,
          token,
          expiresAt,
          downloads: 0,
          maxDownloads,
          revoked: false,
          createdAt: new Date(),
        });

        res.json({
          url: `${process.env.CLIENT_BASE_URL || 'http://localhost:5173'}/s/${token}`,
          token,
          expiresAt,
          file: {
            name: file.originalFilename,
            format: file.format,
            bytes: file.bytes,
            duration: file.duration,
          },
        });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });

    app.get("/api/shares/:token", async (req, res) => {
      try {
        const share = await db
          .collection("shares")
          .findOne({ token: req.params.token });
        if (!share || share.revoked) return res.status(404).json({ message: 'Invalid link' });

        if (share.expiresAt && new Date() > share.expiresAt) {
          return res.status(410).json({ message: 'Link expired' });
        }
        if (share.maxDownloads > 0 && share.downloads >= share.maxDownloads) {
          return res.status(410).json({ message: 'Download limit reached' });
        }

        const file = await db
          .collection("files")
          .findOne({ _id: new ObjectId(share.fileId) });
        if (!file) return res.status(404).json({ message: 'File not found' });

        const secondsLeft = Math.max(
          30,
          Math.min(
            3600,
            Math.floor((share.expiresAt.getTime() - Date.now()) / 1000)
          )
        );

        const signedUrl = cloudinary.url(file.publicId, {
          resource_type: 'video',
          type: 'authenticated',
          sign_url: true,
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + secondsLeft,
          transformation: [{ fetch_format: 'auto' }, { quality: 'auto' }],
        });

        return res.json({
          token: share.token,
          expiresAt: share.expiresAt,
          playUrl: signedUrl,
          file: {
            name: file.originalFilename,
            format: file.format,
            bytes: file.bytes,
            duration: file.duration,
          },
        });
      } catch (e) {
        res.status(500).json({ message: 'Server error' });
      }
    });

    app.get("/s/:token", (req, res) => {
      const clientBase = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
      const url = clientBase + '/s/' + req.params.token;
      return res.redirect(302, url);
    });

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Cleanup job: Revoke expired shares and remove Cloudinary files (chạy mỗi giờ)
    cron.schedule("0 * * * *", async () => {
      try {
        const expiredShares = await db
          .collection("shares")
          .find({ expiresAt: { $lt: new Date() }, revoked: false })
          .toArray();

        for (const share of expiredShares) {
          try {
            const file = await db
              .collection("files")
              .findOne({ _id: new ObjectId(share.fileId) });

            if (file) {
              try {
                await cloudinary.uploader.destroy(file.publicId, {
                  resource_type: "video",
                });
              } catch (e) {
                console.error("Cloudinary destroy error:", e.message);
              }
              await db.collection("files").deleteOne({ _id: file._id });
            }

            await db
              .collection("shares")
              .updateOne({ _id: share._id }, { $set: { revoked: true } });
          } catch (e) {
            console.error("Error processing expired share:", e.message);
          }
        }
      } catch (e) {
        console.error("Cron job error:", e.message);
      }
    });

    const shutdown = async () => {
      try {
        await client.close();
      } finally {
        process.exit(0);
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("Fatal init error:", err);
    process.exit(1);
  }
})();






