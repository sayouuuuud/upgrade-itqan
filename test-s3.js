const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

async function testUpload() {
    console.log("Bucket:", BUCKET_NAME);
    console.log("Region:", process.env.AWS_REGION);
    console.log("AccessKey:", process.env.AWS_ACCESS_KEY_ID ? "Loaded" : "Missing");
    
    try {
        const result = await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: "uploads/test-file.txt",
            Body: Buffer.from("Hello world"),
            ContentType: "text/plain",
        }));
        console.log("Upload Success:", result);
    } catch (e) {
        console.error("Upload Error:", e);
    }
}

testUpload();
