// ============================================
// My First MCP Server - Dev Notes Manager
// ============================================
// This server gives Claude four tools:
//   1. save_note    - Save a markdown note to ~/dev-notes/
//   2. list_notes   - List all saved notes
//   3. read_note    - Read a specific note back
//   4. search_notes - Search/filter notes by name, filepath, and date
//
// It communicates over stdio (stdin/stdout),
// which is how Claude Code talks to MCP servers.
// ============================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { z } from "zod";

// ---------------------
// Configuration
// ---------------------

// All notes get saved into ~/dev-notes/
const NOTES_DIR = path.join(os.homedir(), "dev-notes");

// ---------------------
// Helper: ensure the notes directory exists
// ---------------------
async function ensureNotesDir() {
  await fs.mkdir(NOTES_DIR, { recursive: true });
}

// ---------------------
// Create the MCP server
// ---------------------
// The server name and version are sent to the client
// during the initial handshake so it knows who it's talking to.
const server = new McpServer({
  name: "dev-notes",
  version: "1.0.0",
});

// ============================================
// Tool 1: save_note
// ============================================
// Saves a markdown file to ~/dev-notes/<filename>.
// If the filename doesn't end in .md, we add it.
server.tool(
  "save_note",
  "Save a markdown note to ~/dev-notes/",
  {
    // These define the parameters Claude must provide when calling this tool.
    // The MCP SDK uses Zod for validation (it's bundled with the SDK).
    filename: z.string().describe("Name for the note file (e.g. 'todo.md')"),
    content: z.string().describe("The markdown content of the note"),
  },
  async ({ filename, content }) => {
    await ensureNotesDir();

    // Make sure it ends with .md
    const safeName = filename.endsWith(".md") ? filename : `${filename}.md`;
    const filePath = path.join(NOTES_DIR, safeName);

    await fs.writeFile(filePath, content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Saved note to ${filePath}`,
        },
      ],
    };
  }
);

// ============================================
// Tool 2: list_notes
// ============================================
// Lists all files in ~/dev-notes/. No parameters needed.
server.tool(
  "list_notes",
  "List all saved dev notes",
  // Empty object = no parameters
  {},
  async () => {
    await ensureNotesDir();

    const files = await fs.readdir(NOTES_DIR);

    if (files.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No notes found. Use save_note to create one!",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${files.length} note(s):\n${files.map((f) => `  - ${f}`).join("\n")}`,
        },
      ],
    };
  }
);

// ============================================
// Tool 3: read_note
// ============================================
// Reads a specific note from ~/dev-notes/ and returns its contents.
server.tool(
  "read_note",
  "Read a specific dev note by filename",
  {
    filename: z.string().describe("Name of the note file to read (e.g. 'todo.md')"),
  },
  async ({ filename }) => {
    await ensureNotesDir();

    const safeName = filename.endsWith(".md") ? filename : `${filename}.md`;
    const filePath = path.join(NOTES_DIR, safeName);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text",
            text: `Note not found: ${safeName}. Use list_notes to see available notes.`,
          },
        ],
      };
    }
  }
);

// ============================================
// Tool 4: search_notes
// ============================================
// Searches notes in ~/dev-notes/ by name, filepath, and/or date.
server.tool(
  "search_notes",
  "Search and filter dev notes by name, filepath, and/or date",
  {
    name: z
      .string()
      .optional()
      .describe("Filter by filename (case-insensitive, partial match)"),
    filepath: z
      .string()
      .optional()
      .describe("Filter by full filepath (case-insensitive, partial match)"),
    date: z
      .string()
      .optional()
      .describe(
        "Filter by date. Use 'YYYY-MM-DD' for exact date, 'before:YYYY-MM-DD', 'after:YYYY-MM-DD', or 'between:YYYY-MM-DD,YYYY-MM-DD'"
      ),
  },
  async ({ name, filepath, date }) => {
    await ensureNotesDir();

    const files = await fs.readdir(NOTES_DIR);

    if (files.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No notes found. Use save_note to create one!",
          },
        ],
      };
    }

    // Get file stats for each note
    const noteInfos = await Promise.all(
      files.map(async (f) => {
        const fullPath = path.join(NOTES_DIR, f);
        const stats = await fs.stat(fullPath);
        return {
          name: f,
          filepath: fullPath,
          modified: stats.mtime,
        };
      })
    );

    let results = noteInfos;

    // Filter by name (case-insensitive partial match)
    if (name) {
      const query = name.toLowerCase();
      results = results.filter((n) => n.name.toLowerCase().includes(query));
    }

    // Filter by filepath (case-insensitive partial match)
    if (filepath) {
      const query = filepath.toLowerCase();
      results = results.filter((n) =>
        n.filepath.toLowerCase().includes(query)
      );
    }

    // Filter by date
    if (date) {
      const toDateStart = (str) => new Date(str + "T00:00:00");
      const toDateEnd = (str) => new Date(str + "T23:59:59");

      if (date.startsWith("before:")) {
        const cutoff = toDateEnd(date.slice("before:".length));
        results = results.filter((n) => n.modified <= cutoff);
      } else if (date.startsWith("after:")) {
        const cutoff = toDateStart(date.slice("after:".length));
        results = results.filter((n) => n.modified >= cutoff);
      } else if (date.startsWith("between:")) {
        const [start, end] = date.slice("between:".length).split(",");
        const startDate = toDateStart(start.trim());
        const endDate = toDateEnd(end.trim());
        results = results.filter(
          (n) => n.modified >= startDate && n.modified <= endDate
        );
      } else {
        // Exact date match (same day)
        const dayStart = toDateStart(date);
        const dayEnd = toDateEnd(date);
        results = results.filter(
          (n) => n.modified >= dayStart && n.modified <= dayEnd
        );
      }
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No notes matched your search criteria.",
          },
        ],
      };
    }

    const output = results
      .map(
        (n) =>
          `  - ${n.name}\n    Path: ${n.filepath}\n    Modified: ${n.modified.toISOString().split("T")[0]}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${results.length} matching note(s):\n${output}`,
        },
      ],
    };
  }
);

// ============================================
// Start the server
// ============================================
// StdioServerTransport connects the server to stdin/stdout,
// which is the communication channel Claude Code uses.
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // The server is now running and waiting for messages from Claude.
  // It will keep running until the client disconnects.
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
