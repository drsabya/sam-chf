// src/routes/apis/vision/efficacy/+server.ts
// src/routes/apis/vision/efficacy/+server.ts
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';

// Make sure key is coming from SvelteKit env
console.log('Gemini key present?', !!GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || !(file instanceof File)) {
			return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
		}

		const mimeType = file.type || 'application/pdf';
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64Data = buffer.toString('base64');

		const prompt = `
You are a lab report extraction bot.

From this single lab report (image or PDF), find the NUMERIC values for:
- TSH
- Homocysteine
- BNP or NT-proBNP

Important:
- If a value is not present, use null.
- Respond ONLY with pure JSON like:
{"tsh": 2.5, "homocysteine": 14.2, "bnp": 560}
Do not add any extra text.
		`.trim();

		const result = await model.generateContent([
			{
				inlineData: {
					data: base64Data,
					mimeType
				}
			},
			{ text: prompt }
		]);

		const response = result.response;
		const text = response.text().trim();

		// Try to parse JSON safely
		let parsed: any = {};
		try {
			parsed = JSON.parse(text);
		} catch {
			// If Gemini adds extra text, try to strip before/after braces
			const match = text.match(/\{[\s\S]*\}/);
			if (match) {
				parsed = JSON.parse(match[0]);
			} else {
				throw new Error('Could not parse AI response as JSON');
			}
		}

		const tsh = parsed.tsh ?? null;
		const homocysteine = parsed.homocysteine ?? null;
		const bnp = parsed.bnp ?? null;

		return new Response(JSON.stringify({ tsh, homocysteine, bnp }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Gemini extraction error', err);
		return new Response(JSON.stringify({ error: 'Extraction failed' }), { status: 500 });
	}
};
