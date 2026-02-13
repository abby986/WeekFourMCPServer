About:

This Dev Notes server gives special tools to Claude to help it save, list, read, and search for notes. This is particularly useful because it helps give Claude persistent memory across sessions, allowing it to reference and use the information saved in the notes.




Installation Instructions:

Make sure Node.js is installed before following instructions by typing "node -v" or "node --version" in the terminal.

1. Navigate to the project folder
2. Run "npm install" to install the neccessary dependencies
3. Register the server with Claude Code by either adding it to your MCP config (.claude.json) or using the command "claude mcp add dev-notes node /full/path/to/dev-notes-server/index.js"
4. Restart Claude code
5. Use command "/mcp" to ensure dev-notes is installed and connected




Usage Examples:

-Example 1: You ask Claude to save a note called meeting-objectives with the following items:
Check employee progress
Discuss revenue
Assign new project tasks
Claude calls the save_note tool and saves the note for you!

-Example 2: You want to confirm that your note was saved, so you ask Claude to list your notes.
Claude calls the list_notes tool and lists all the notes for you!

-Example 3: You want to go over your note and make sure it has everything you wanted inside, so you ask claude to read it to you.
Claude calls the read_note tool and reads your specified note!

-Example 4: You were working on a project last week and took a couple notes. You want to go through and see a list of the notes you created on Tuesday last week. You give Claude that date and ask it to give you all the notes created on that day.
Claude calls the search_notes tool and returns all the note files created that day!




Limitations:

The search function can only find notes through the date, filepath, or name of the note and needs you to be specific.
Notes are only saved as .md files
No delete tool
Notes are stored locally only
