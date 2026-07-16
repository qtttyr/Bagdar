/**
 * JSON Schema for Groq structured output (response_format: json_schema).
 *
 * This schema constrains the AI to produce valid roadmap JSON matching
 * our exact data model — no parsing, no hallucinations, no extra fields.
 */

export const ROADMAP_SCHEMA = {
  name: "roadmap" as const,
  strict: true as const,
  schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short, compelling title for this learning route",
      },
      total_duration: {
        type: "integer",
        description: "Total duration in minutes matching the requested session length",
      },
      steps: {
        type: "array",
        description: "Learning stations in chronological order",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique step identifier (e.g. step_1, step_2)",
            },
            title: {
              type: "string",
              description: "Clear topic name for this station",
            },
            duration: {
              type: "integer",
              description: "Duration in minutes (5-120 min)",
              minimum: 5,
              maximum: 120,
            },
            description: {
              type: "string",
              description: "Brief description of what this station covers",
            },
            type: {
              type: "string",
              enum: ["learning", "practice", "break"],
              description: "learning: new material, practice: exercises, break: rest",
            },
            order: {
              type: "integer",
              description: "Sequential position starting from 1",
            },
            checklist: {
              type: "array",
              description: "Detailed skill checklist for learning steps (4-6 items)",
              items: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "Specific actionable skill or sub-topic",
                  },
                  type: {
                    type: "string",
                    enum: ["theory", "math", "practice", "visual"],
                    description: "theory: concepts, math: calculations, practice: hands-on, visual: diagrams/charts",
                  },
                },
                required: ["text", "type"],
                additionalProperties: false,
              },
            },
          },
          required: ["id", "title", "duration", "description", "type", "order", "checklist"],
          additionalProperties: false,
        },
      },
      breaks: {
        type: "array",
        description: "Scheduled rest breaks between stations",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique break identifier (e.g. break_1)",
            },
            duration: {
              type: "integer",
              description: "Break duration in minutes (1-30 min)",
              minimum: 1,
              maximum: 30,
            },
            message: {
              type: "string",
              description: "A helpful rest message, tip, or cultural wisdom",
            },
          },
          required: ["id", "duration", "message"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "total_duration", "steps", "breaks"],
    additionalProperties: false,
  },
};
