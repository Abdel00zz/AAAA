// This function will be deployed as a serverless function on a platform like Vercel.

// Helper to convert ArrayBuffer to Base64, compatible with edge runtimes
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// This function uses the Web Standard Request and Response objects,
// making it compatible with environments like Vercel Edge Functions.
export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const formData = await request.formData();
        
        const subject = formData.get('_subject') as string;
        const message = formData.get('message') as string;
        const attachmentFile = formData.get('attachment') as File;

        if (!subject || !message || !attachmentFile) {
            return new Response(JSON.stringify({ message: 'Missing required fields.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // IMPORTANT: The API_KEY must be set as an environment variable in your deployment platform (e.g., Vercel).
        const resendApiKey = process.env.API_KEY;
        if (!resendApiKey) {
            console.error('API_KEY is not set.');
            return new Response(JSON.stringify({ message: 'Server configuration error.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const buffer = await attachmentFile.arrayBuffer();
        const attachmentBase64 = arrayBufferToBase64(buffer);

        const emailPayload = {
            // IMPORTANT: This 'from' address must be associated with a domain you have verified in Resend.
            from: 'Le Centre Scientifique <onboarding@resend.dev>', 
            to: ['bdh.malek@gmail.com'],
            subject: subject,
            // The message is pre-formatted, wrap in <pre> to preserve whitespace and newlines.
            html: `<pre style="font-family: monospace; white-space: pre-wrap;">${message}</pre>`,
            attachments: [
                {
                    filename: attachmentFile.name,
                    content: attachmentBase64,
                },
            ],
        };

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify(emailPayload),
        });

        const data = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API error:', data);
            return new Response(JSON.stringify({ message: 'Failed to send email.', error: data }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error handling submission:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error', error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Vercel requires a config export for functions to specify the runtime.
// 'edge' is lightweight and uses the standard Web APIs we've used above.
export const config = {
    runtime: 'edge',
};