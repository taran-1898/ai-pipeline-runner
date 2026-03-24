import { google, drive_v3 } from "googleapis";

export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");

    if (!clientEmail || !privateKey) {
      throw new Error("Google Drive service account credentials are not configured");
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    this.drive = google.drive({ version: "v3", auth });
  }

  async uploadFile(buffer: Buffer, filename: string, folderId?: string) {
    const res = await this.drive.files.create({
      requestBody: {
        name: filename,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: "application/octet-stream",
        body: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
      },
      fields: "id, name, mimeType",
    });

    return res.data;
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const res = await this.drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" as any }
    );

    return Buffer.from(res.data as any);
  }

  async listFiles(folderId?: string) {
    const q = folderId ? `'${folderId}' in parents and trashed = false` : "trashed = false";
    const res = await this.drive.files.list({
      q,
      fields: "files(id, name, mimeType, parents, createdTime)",
    });
    return res.data.files ?? [];
  }
}

