import { S3Client } from '@aws-sdk/client-s3';
import {
	R2_ACCOUNT_ID as CF_R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID as CF_R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY as CF_R2_SECRET_ACCESS_KEY,
	R2_BUCKET as CF_R2_BUCKET
} from '$env/static/private';

// Environment variables from SvelteKit private env
const accountId = CF_R2_ACCOUNT_ID;
const accessKeyId = CF_R2_ACCESS_KEY_ID;
const secretAccessKey = CF_R2_SECRET_ACCESS_KEY;
const bucket = CF_R2_BUCKET;

// R2 endpoint using your account ID
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

export const r2 = new S3Client({
	region: 'auto',
	endpoint,
	credentials: {
		accessKeyId,
		secretAccessKey
	}
});

export const R2_BUCKET = bucket;
