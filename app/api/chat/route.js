import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `Welcome to Guitar Haven, your go-to place for all things guitar! As your virtual assistant, I'm here to help you find the perfect guitar to start your musical journey. Whether you're a complete beginner or looking to upgrade from your first instrument, I'm here to guide you through the selection process.

Here’s how I can help:

<ul>
  <li><strong>Understanding Your Needs:</strong> I’ll ask you a few questions to understand your musical preferences, budget, and playing goals.</li>
  <li><strong>Guitar Types:</strong> I can explain the different types of guitars (acoustic, electric, classical) and their unique features.</li>
  <li><strong>Recommendations:</strong> Based on your preferences, I’ll recommend guitars that suit your style and budget.</li>
  <li><strong>Accessories:</strong> I can suggest essential accessories like picks, straps, tuners, and cases to complement your guitar.</li>
  <li><strong>Learning Resources:</strong> I can point you towards beginner-friendly tutorials, online courses, and local instructors to help you get started.</li>
</ul>

Let’s find the perfect guitar for you! How can I assist you today?`;

// POST function to handle incoming requests
export async function POST(req) {
  try {
    const openai = new OpenAI(); // Create a new instance of the OpenAI client
    const data = await req.json(); // Parse the JSON body of the incoming request

    // Validate the incoming data
    if (!data || !Array.isArray(data.messages)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Specify the model to use
      messages: [{ role: 'system', content: systemPrompt }, ...data.messages], // Include the system prompt and user messages
      stream: true, // Enable streaming responses
    });

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content); // Encode the content to Uint8Array
              controller.enqueue(text); // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          console.error('Error during stream processing:', err);
          controller.error(err); // Handle any errors that occur during streaming
        } finally {
          controller.close(); // Close the stream when done
        }
      },
    });

    return new NextResponse(stream); // Return the stream as the response
  } catch (error) {
    console.error('Error handling the POST request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
