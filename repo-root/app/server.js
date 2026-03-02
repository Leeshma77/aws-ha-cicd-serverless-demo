import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET;            // set via EC2 user data or scripts
const DDB_TABLE = process.env.DDB_TABLE || 'FileMetadata';  // same table used by Lambda

const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/health', (_req, res) => res.status(200).send('OK'));

app.get('/files', async (_req, res) => {
  try {
    const data = await ddb.send(new ScanCommand({ TableName: DDB_TABLE, Limit: 100 }));
    res.status(200).json({ count: (data.Items || []).length, items: data.Items || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read DynamoDB' });
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!UPLOAD_BUCKET) return res.status(500).send('UPLOAD_BUCKET not configured');
    const file = req.file;
    if (!file) return res.status(400).send('No file provided');
    const key = `${Date.now()}_${file.originalname}`;
    await s3.send(new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));
    res.status(200).send(`Uploaded to S3 as ${key}. Check /files shortly.`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Upload failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App running on ${PORT}`));
