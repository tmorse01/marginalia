"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// OpenAI API types
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

/**
 * Main action for AI chat completion
 * Calls OpenAI API with conversation context and note content
 */
export const chat = action({
  args: {
    userId: v.id("users"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
      content: v.string(),
    })),
    noteTitle: v.string(),
    noteContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user has AI access (premium/authorized)
    const hasAccess = await ctx.runQuery(internal.users.hasAIAccessInternal, {
      userId: args.userId,
    });

    if (!hasAccess) {
      throw new Error("AI access is restricted to authorized users. Please contact an administrator to enable AI features.");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Please set it in the Convex dashboard.");
    }

    // Build system prompt with note context
    const systemPrompt = `You are a helpful AI assistant for a markdown note-taking application. 
The user is working on a note with the following details:

Title: ${args.noteTitle}

Current Content:
${args.noteContent}

Your role is to help the user write, edit, and improve their markdown notes. You can:
- Generate new content based on user requests
- Improve existing content (grammar, clarity, structure)
- Suggest edits and improvements
- Answer questions about the note
- Help format markdown properly

When suggesting edits, be clear and specific. If the user asks you to modify content, provide the complete updated text or clearly indicate what should be changed.

Always respond in a helpful, conversational manner. Format your responses using markdown when appropriate.`;

    // Prepare messages for OpenAI API
    const openAIMessages: Array<ChatMessage> = [
      { role: "system", content: systemPrompt },
      ...args.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using cost-effective model, can be made configurable
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`;
        
        if (response.status === 401) {
          throw new Error("Invalid OpenAI API key. Please check your configuration.");
        } else if (response.status === 429) {
          throw new Error("OpenAI API rate limit exceeded. Please try again in a moment.");
        } else if (response.status >= 500) {
          throw new Error("OpenAI API is temporarily unavailable. Please try again later.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = (await response.json()) as OpenAIResponse;

      if (data.error) {
        throw new Error(data.error.message || "OpenAI API returned an error");
      }

      if (data.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      return {
        content: data.choices[0].message.content,
        success: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to communicate with OpenAI API");
    }
  },
});
