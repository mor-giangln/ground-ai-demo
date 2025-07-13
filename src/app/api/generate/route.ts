// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { name, role, company } = await req.json();

    const prompt = `Write a friendly, concise LinkedIn DM to someone named ${name}, who is a ${role} at ${company}. Make it casual and under 500 characters.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    return NextResponse.json({
      message: completion.choices[0].message?.content ?? '',
    });
  } catch (error: unknown) {
    console.error('API generate error:', error);
    // Handle insufficient quota specifically
    if (error.message?.includes('insufficient_quota') || error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Insufficient OpenAI quota. Please refill your API quota.' },
        { status: 402 }
      );
    }
    // Generic error
    return NextResponse.json(
      { error: 'Failed to generate message. Please try again later.' },
      { status: 500 }
    );
  }
}
