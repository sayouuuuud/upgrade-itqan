import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getSession } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL", file.url);
      return { uploadedBy: metadata.userId };
    }),

  audioUploader: f({ audio: { maxFileSize: "32MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Audio upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  pdfUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      // Allow admins, readers, and pending teacher/reader applicants to upload
      // PDFs (certificates, ijazat, CVs, ...).
      if (!session) throw new Error("Unauthorized");
      const allowed = ["admin", "academy_admin", "reader", "teacher"]
      if (!allowed.includes(session.role)) {
        throw new Error("Unauthorized");
      }
      return { userId: session.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("PDF upload complete by:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // Combined uploader for application materials (audio + pdf in same flow).
  applicationUploader: f({
    audio: { maxFileSize: "32MB", maxFileCount: 1 },
    pdf:   { maxFileSize: "8MB",  maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.sub };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Application file upload by:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
